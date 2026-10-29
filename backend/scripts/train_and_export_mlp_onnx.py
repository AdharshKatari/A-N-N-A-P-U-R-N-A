"""
Train and Export Upgraded MLP Baseline to Lightweight ONNX Format

Enhancements:
1. Replaces raw 12,288 flattened pixel vectors with compact 42-dim spatial descriptors:
   - Color Channel Moments (mean, std, skew in RGB and HSV spaces)
   - Histogram of Oriented Gradients (HOG) texture/edge features
   - Hu invariant spatial contour moments
   - Laplacian surface sharpness variance
2. Trains Scikit-Learn MLPClassifier (42 -> 138 -> 67 -> 2)
3. Converts model to ONNX using skl2onnx (reducing size from 27.2 MB to ~60 KB)
4. Eliminates pickle/numpy.long environment mismatches completely
"""

import os
import zipfile
import cv2
import numpy as np
from skimage.feature import hog
from sklearn.neural_network import MLPClassifier
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType


def extract_spatial_color_descriptors(bgr_img: np.ndarray) -> np.ndarray:
    """
    Extracts invariant 42-dimensional statistical spatial and color descriptor:
    - 18 color moments (RGB + HSV: mean, std, skewness)
    - 16 HOG multi-scale gradient features
    - 7 log-transformed Hu shape moments
    - 1 Laplacian sharpness variance
    """
    # 1. Color moments in RGB and HSV
    hsv = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2HSV)
    moments = []
    for ch in cv2.split(bgr_img):
        m = float(np.mean(ch))
        s = float(np.std(ch))
        skew = float(np.mean((ch - m) ** 3) / (s ** 3 + 1e-5))
        moments.extend([m / 255.0, s / 255.0, skew])

    for ch in cv2.split(hsv):
        m = float(np.mean(ch))
        s = float(np.std(ch))
        skew = float(np.mean((ch - m) ** 3) / (s ** 3 + 1e-5))
        moments.extend([m / 255.0, s / 255.0, skew])

    # 2. HOG texture features on grayscale 64x64
    gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)
    gray_64 = cv2.resize(gray, (64, 64))
    hog_feats = hog(gray_64, orientations=8, pixels_per_cell=(16, 16), cells_per_block=(1, 1), feature_vector=True)

    # 3. Hu Moments (scale & rotation invariant)
    hu = cv2.HuMoments(cv2.moments(gray)).flatten()
    hu_log = -np.sign(hu) * np.log10(np.abs(hu) + 1e-10)

    # 4. Blur variance
    blur_var = float(cv2.Laplacian(gray, cv2.CV_64F).var()) / 1000.0  # Scaled for numerical stability

    feat_vec = np.hstack([moments, hog_feats[:16], hu_log, [blur_var]])
    return feat_vec.astype(np.float32)


def train_and_export_mlp():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    project_root = os.path.dirname(base_dir)
    zip_path = os.path.join(project_root, "tomatoleaf.zip")
    if not os.path.exists(zip_path):
        zip_path = os.path.join(os.path.dirname(project_root), "tomatoleaf.zip")

    print(f"Reading dataset for MLP training from: {zip_path}")
    X = []
    y = []

    with zipfile.ZipFile(zip_path, "r") as z:
        healthy_files = [n for n in z.namelist() if "Tomato___healthy" in n and n.lower().endswith(".jpg")][:150]
        diseased_files = [
            n for n in z.namelist()
            if ("Late_blight" in n or "Bacterial_spot" in n or "Early_blight" in n or "Septoria" in n)
            and n.lower().endswith(".jpg")
        ][:150]

        for f in healthy_files:
            data = z.read(f)
            img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
            if img is not None:
                X.append(extract_spatial_color_descriptors(img))
                y.append(0)  # 0 = Fresh

        for f in diseased_files:
            data = z.read(f)
            img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
            if img is not None:
                X.append(extract_spatial_color_descriptors(img))
                y.append(1)  # 1 = Spoiled

    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int32)
    print(f"Dataset assembled: {X.shape[0]} samples with {X.shape[1]} spatial/color descriptors.")

    # Train MLPClassifier
    print("Training MLP (42 -> 138 -> 67 -> 2)...")
    mlp = MLPClassifier(hidden_layer_sizes=(138, 67), activation="relu", solver="adam", max_iter=250, random_state=42)
    mlp.fit(X, y)

    score = mlp.score(X, y)
    print(f"MLP Training Accuracy: {score * 100:.2f}%")

    # Export to ONNX via skl2onnx
    storage_dir = os.path.join(base_dir, "storage")
    os.makedirs(storage_dir, exist_ok=True)
    onnx_path = os.path.join(storage_dir, "mlp_baseline_model.onnx")

    initial_type = [("float_input", FloatTensorType([None, 42]))]
    onnx_model = convert_sklearn(mlp, initial_types=initial_type, target_opset=14)

    with open(onnx_path, "wb") as f:
        f.write(onnx_model.SerializeToString())

    size_kb = os.path.getsize(onnx_path) / 1024.0
    print(f"Lightweight MLP ONNX model saved to: {onnx_path} ({size_kb:.1f} KB)")

    # Remove old 27MB pickle file if present to reclaim space
    old_pkl = os.path.join(project_root, "mlp_baseline_model.pkl")
    if os.path.exists(old_pkl):
        os.remove(old_pkl)
        print("Removed deprecated 27.2 MB pickle file.")


if __name__ == "__main__":
    train_and_export_mlp()
