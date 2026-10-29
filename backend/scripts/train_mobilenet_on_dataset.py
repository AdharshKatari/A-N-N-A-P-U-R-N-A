"""
Train and Calibrate MobileNetV2 Biological Degradation Model on Tomato Dataset

Streams real healthy and diseased produce images directly from tomatoleaf.zip in memory:
- Enforces Laplacian blur guardrail (Var >= 30.0)
- Maps botanical disease classes to continuous degradation indices (D_i ∈ [0.0, 1.0])
- Trains multi-task regression head on frozen MobileNetV2 feature extractor
- Exports fine-tuned weights directly to backend/storage/mobilenetv2_degradation.onnx
"""

import os
import sys
import zipfile
import random
import cv2
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import torchvision.models as models

# Botanical disease class to continuous biological degradation mapping
BIOLOGICAL_LABEL_MAP = {
    "Tomato___healthy": {"d_i": 0.05, "defect": 0.0, "ripeness": 0.50, "conf": 0.95},
    "Tomato___Spider_mites Two-spotted_spider_mite": {"d_i": 0.40, "defect": 0.80, "ripeness": 0.50, "conf": 0.88},
    "Tomato___Leaf_Mold": {"d_i": 0.45, "defect": 0.85, "ripeness": 0.50, "conf": 0.88},
    "Tomato___Septoria_leaf_spot": {"d_i": 0.55, "defect": 0.90, "ripeness": 0.55, "conf": 0.90},
    "Tomato___Target_Spot": {"d_i": 0.60, "defect": 0.90, "ripeness": 0.55, "conf": 0.90},
    "Tomato___Early_blight": {"d_i": 0.65, "defect": 0.95, "ripeness": 0.60, "conf": 0.92},
    "Tomato___Bacterial_spot": {"d_i": 0.70, "defect": 0.95, "ripeness": 0.60, "conf": 0.92},
    "Tomato___Tomato_mosaic_virus": {"d_i": 0.70, "defect": 0.95, "ripeness": 0.60, "conf": 0.90},
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {"d_i": 0.75, "defect": 0.95, "ripeness": 0.65, "conf": 0.92},
    "Tomato___Late_blight": {"d_i": 0.85, "defect": 1.00, "ripeness": 0.75, "conf": 0.95},
}

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(3, 1, 1)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(3, 1, 1)


class InMemoryZipTomatoDataset(Dataset):
    """Streams and decodes images directly from zip archive without disk decompression."""

    def __init__(self, zip_path: str, samples_per_class: int = 50, blur_threshold: float = 30.0):
        self.samples = []
        self.labels = []
        random.seed(42)

        print(f"Reading dataset from {zip_path} (sampling {samples_per_class} per class)...")
        with zipfile.ZipFile(zip_path, "r") as z:
            class_files = {cls_name: [] for cls_name in BIOLOGICAL_LABEL_MAP}

            for name in z.namelist():
                parts = name.split("/")
                if len(parts) > 2 and parts[1] == "train" and (name.lower().endswith(".jpg") or name.lower().endswith(".jpeg")):
                    cls_name = parts[2]
                    if cls_name in class_files:
                        class_files[cls_name].append(name)

            for cls_name, files in class_files.items():
                sampled = random.sample(files, min(samples_per_class, len(files)))
                label_meta = BIOLOGICAL_LABEL_MAP[cls_name]
                target_vector = np.array(
                    [label_meta["d_i"], label_meta["defect"], label_meta["ripeness"], label_meta["conf"]],
                    dtype=np.float32,
                )

                for f_name in sampled:
                    data = z.read(f_name)
                    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
                    if img is None:
                        continue

                    # Blur guardrail
                    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                    if cv2.Laplacian(gray, cv2.CV_64F).var() < blur_threshold:
                        continue

                    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                    resized = cv2.resize(rgb, (224, 224), interpolation=cv2.INTER_AREA)
                    tensor = resized.astype(np.float32) / 255.0
                    tensor = np.transpose(tensor, (2, 0, 1))
                    tensor = (tensor - IMAGENET_MEAN) / IMAGENET_STD

                    self.samples.append(tensor)
                    self.labels.append(target_vector)

        print(f"Loaded {len(self.samples)} valid samples passing blur guardrails across {len(BIOLOGICAL_LABEL_MAP)} classes.")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        return torch.tensor(self.samples[idx], dtype=torch.float32), torch.tensor(self.labels[idx], dtype=torch.float32)


class MobileNetV2BiologicalDegradation(nn.Module):
    """MobileNetV2 with fine-tuned biological regression head."""

    def __init__(self):
        super().__init__()
        mobilenet = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
        self.features = mobilenet.features

        # Freeze feature extractor layers for fast, stable edge adaptation
        for param in self.features.parameters():
            param.requires_grad = False

        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.head = nn.Sequential(
            nn.Dropout(p=0.2),
            nn.Linear(1280, 64),
            nn.ReLU(inplace=True),
            nn.Linear(64, 4),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        feat = self.features(x)
        pooled = self.pool(feat)
        flat = torch.flatten(pooled, 1)
        raw_outputs = self.head(flat)
        return torch.sigmoid(raw_outputs)


def train_and_export():
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    zip_path = os.path.join(project_root, "tomatoleaf.zip")
    if not os.path.exists(zip_path):
        # Check parent folder
        zip_path = os.path.join(os.path.dirname(project_root), "tomatoleaf.zip")

    if not os.path.exists(zip_path):
        print(f"Error: tomatoleaf.zip not found at {zip_path}")
        sys.exit(1)

    dataset = InMemoryZipTomatoDataset(zip_path, samples_per_class=60, blur_threshold=30.0)

    # 80/20 train/val split
    val_size = int(len(dataset) * 0.20)
    train_size = len(dataset) - val_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)

    print(f"Dataset split: Train = {train_size} | Validation = {val_size}")

    device = torch.device("cpu")
    model = MobileNetV2BiologicalDegradation().to(device)

    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.head.parameters(), lr=1e-3, weight_decay=1e-4)

    epochs = 4
    print("\n--- Training MobileNetV2 Biological Head on Dataset ---")
    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        for inputs, targets in train_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * inputs.size(0)

        train_loss /= train_size

        # Validation
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for inputs, targets in val_loader:
                inputs, targets = inputs.to(device), targets.to(device)
                outputs = model(inputs)
                loss = criterion(outputs, targets)
                val_loss += loss.item() * inputs.size(0)

        val_loss /= val_size
        print(f"Epoch {epoch}/{epochs} | Train MSE: {train_loss:.5f} | Val MSE: {val_loss:.5f}")

    # Export to ONNX
    storage_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage")
    os.makedirs(storage_dir, exist_ok=True)
    onnx_path = os.path.join(storage_dir, "mobilenetv2_degradation.onnx")

    model.eval()
    dummy_input = torch.randn(1, 3, 224, 224, dtype=torch.float32)

    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=["input_tensor"],
        output_names=["biological_metrics"],
        dynamic_axes={
            "input_tensor": {0: "batch_size"},
            "biological_metrics": {0: "batch_size"},
        },
        dynamo=False,
    )

    print(f"\nTrained MobileNetV2 ONNX model saved to: {onnx_path}")
    print("Training and calibration complete!")


if __name__ == "__main__":
    train_and_export()
