import os
import time
import logging
from typing import Dict, Any, List, Optional
import httpx
from pydantic import BaseModel

logger = logging.getLogger("BhoonidhiClient")
logging.basicConfig(level=logging.INFO)

class BhoonidhiClient:
    """
    Production-grade API Client for ISRO's Bhoonidhi Data Access System.
    Handles JWT authentication, token refreshing, STAC collection searching,
    and satellite imagery metadata retrieval.
    """
    BASE_URL = "https://bhoonidhi-api.nrsc.gov.in"

    def __init__(self, user_id: Optional[str] = None, password: Optional[str] = None):
        # Read from environment variables if not passed directly
        self.user_id = user_id or os.environ.get("ISRO_BHOONIDHI_USER_ID")
        self.password = password or os.environ.get("ISRO_BHOONIDHI_PASSWORD")
        
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.token_expiry: float = 0.0  # Unix timestamp when token expires

    def authenticate(self) -> bool:
        """
        Requests a JWT Access Token using user credentials.
        Endpoint: POST /auth/token
        """
        if not self.user_id or not self.password:
            logger.error("Bhoonidhi authentication failed: Credentials missing from environment or parameters.")
            return False

        url = f"{self.BASE_URL}/auth/token"
        payload = {
            "userId": self.user_id,
            "password": self.password,
            "grant_type": "password"
        }

        try:
            logger.info(f"Authenticating Bhoonidhi user: {self.user_id}")
            response = httpx.post(url, json=payload, timeout=10.0)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.refresh_token = data.get("refresh_token")
                
                # Set local expiry time (subtracting 30 seconds buffer)
                expires_in = data.get("expires_in", 1200)
                self.token_expiry = time.time() + expires_in - 30
                logger.info("Bhoonidhi authentication token successfully generated.")
                return True
            else:
                logger.error(f"Authentication failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            logger.error(f"Connection error to Bhoonidhi authentication server: {str(e)}")
            return False

    def refresh_access_token(self) -> bool:
        """
        Obtains a new access token using the stored refresh token.
        Endpoint: POST /auth/token
        """
        if not self.refresh_token:
            logger.warning("No refresh token found. Re-authenticating with credentials.")
            return self.authenticate()

        url = f"{self.BASE_URL}/auth/token"
        payload = {
            "userId": self.user_id,
            "refresh_token": self.refresh_token,
            "grant_type": "refresh_token"
        }

        try:
            logger.info("Refreshing Bhoonidhi session token...")
            response = httpx.post(url, json=payload, timeout=10.0)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.refresh_token = data.get("refresh_token")
                expires_in = data.get("expires_in", 1200)
                self.token_expiry = time.time() + expires_in - 30
                logger.info("Bhoonidhi access token successfully refreshed.")
                return True
            else:
                logger.error(f"Token refresh failed: {response.text}")
                # Fallback to credential authentication
                return self.authenticate()
        except Exception as e:
            logger.error(f"Error during token refresh: {str(e)}")
            return self.authenticate()

    def _get_auth_headers(self) -> Dict[str, str]:
        """
        Ensures a valid access token is active and returns the required headers.
        """
        # If token has expired or is close to expiring, refresh it
        if not self.access_token or time.time() >= self.token_expiry:
            success = self.refresh_access_token()
            if not success:
                raise Exception("Unable to authenticate with Bhoonidhi APIs. Verify credentials.")
        
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

    def search_ndvi_data(
        self, 
        latitude: float, 
        longitude: float, 
        collection: str = "EOS-06_OCM-LAC_NDVI_8day_360m",
        radius_km: float = 10.0
    ) -> List[Dict[str, Any]]:
        """
        Queries Bhoonidhi STAC catalog for NDVI satellite footprints intersecting coordinates.
        Endpoint: POST /data/search
        """
        url = f"{self.BASE_URL}/data/search"
        
        # Approximate boundary box calculation
        lat_offset = radius_km / 111.0
        lng_offset = radius_km / (111.0 * abs(latitude / 90.0 + 1e-6))
        bbox = [
            str(longitude - lng_offset),
            str(latitude - lat_offset),
            str(longitude + lng_offset),
            str(latitude + lat_offset)
        ]

        payload = {
            "collections": [collection],
            "bbox": bbox,
            "limit": 10,
            "filter-lang": "cql2-json"
        }

        try:
            headers = self._get_auth_headers()
            logger.info(f"Searching Bhoonidhi collection '{collection}' for bbox: {bbox}")
            response = httpx.post(url, json=payload, headers=headers, timeout=15.0)
            
            if response.status_code == 200:
                result = response.json()
                features = result.get("features", [])
                logger.info(f"Found {len(features)} matching satellite grid assets.")
                return features
            elif response.status_code == 401:
                # Token expired unexpectedly, try once more with forced auth
                self.access_token = None
                headers = self._get_auth_headers()
                response = httpx.post(url, json=payload, headers=headers, timeout=15.0)
                if response.status_code == 200:
                    return response.json().get("features", [])
                
            logger.error(f"Search failed with status {response.status_code}: {response.text}")
            return []
        except Exception as e:
            logger.error(f"Bhoonidhi STAC search request failed: {str(e)}")
            return []

if __name__ == "__main__":
    # Test runner script
    # Run locally with: python bhoonidhi_client.py
    print("--- Testing ISRO Bhoonidhi API Client Interface ---")
    client = BhoonidhiClient(
        user_id="test_user", 
        password="test_password"
    )
    # This will log a failure unless mock credentials or real credentials are loaded.
    client.authenticate()
