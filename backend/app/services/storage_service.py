"""
Storage service for managing media files.
Handles file storage, retrieval, and GDPR-compliant deletion.
"""
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, List

logger = logging.getLogger(__name__)


class StorageService:
    """Service for media storage operations."""
    
    def __init__(self, media_root: str = "./media", retention_days: int = 30):
        """
        Initialize storage service.
        
        Args:
            media_root: Root directory for media files
            retention_days: Number of days to retain files before auto-deletion
        """
        self.media_root = Path(media_root)
        self.retention_days = retention_days
        self.upload_dir = self.media_root / "uploads"
        self.processed_dir = self.media_root / "processed"
        
        # Create directories if they don't exist
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Ensure all required directories exist."""
        self.media_root.mkdir(parents=True, exist_ok=True)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)
    
    async def save_upload(self, file_data: bytes, filename: str) -> str:
        """
        Save an uploaded file.
        
        Args:
            file_data: File data as bytes
            filename: Original filename
            
        Returns:
            Path to saved file
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{filename}"
        file_path = self.upload_dir / safe_filename
        
        file_path.write_bytes(file_data)
        logger.info(f"Saved upload: {file_path}")
        return str(file_path)
    
    async def save_processed(self, file_data: bytes, filename: str) -> str:
        """
        Save a processed file.
        
        Args:
            file_data: File data as bytes
            filename: Filename for processed file
            
        Returns:
            Path to saved file
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{filename}"
        file_path = self.processed_dir / safe_filename
        
        file_path.write_bytes(file_data)
        logger.info(f"Saved processed file: {file_path}")
        return str(file_path)
    
    async def get_file(self, file_path: str) -> Optional[bytes]:
        """
        Retrieve a file.
        
        Args:
            file_path: Path to file
            
        Returns:
            File data as bytes, or None if not found
        """
        path = Path(file_path)
        if path.exists() and path.is_file():
            return path.read_bytes()
        return None
    
    async def delete_file(self, file_path: str) -> bool:
        """
        Delete a file.
        
        Args:
            file_path: Path to file to delete
            
        Returns:
            True if deletion successful, False otherwise
        """
        path = Path(file_path)
        if path.exists() and path.is_file():
            path.unlink()
            logger.info(f"Deleted file: {file_path}")
            return True
        return False
    
    async def cleanup_old_files(self) -> int:
        """
        Clean up files older than retention period (GDPR compliance).
        
        Returns:
            Number of files deleted
        """
        cutoff_date = datetime.now() - timedelta(days=self.retention_days)
        deleted_count = 0
        
        for directory in [self.upload_dir, self.processed_dir]:
            for file_path in directory.iterdir():
                if file_path.is_file():
                    file_time = datetime.fromtimestamp(file_path.stat().st_mtime)
                    if file_time < cutoff_date:
                        file_path.unlink()
                        deleted_count += 1
                        logger.info(f"Deleted old file: {file_path}")
        
        return deleted_count
    
    async def list_files(self, directory: str = "uploads") -> List[str]:
        """
        List files in a directory.
        
        Args:
            directory: Directory name ("uploads" or "processed")
            
        Returns:
            List of file paths
        """
        if directory == "uploads":
            dir_path = self.upload_dir
        elif directory == "processed":
            dir_path = self.processed_dir
        else:
            return []
        
        return [str(f) for f in dir_path.iterdir() if f.is_file()]
