/**
 * ReviewScreen - Displays captured photos with retake option.
 */
export function ReviewScreen({ photos, onRetake }) {
  return (
    <div className="review-screen">
      <h2 className="review-title">Your photos</h2>
      <div className="photos-row">
        {photos.map((url, i) => (
          <div key={i} className="photo-frame">
            <img src={url} alt={`Photo ${i + 1}`} className="review-photo" />
          </div>
        ))}
      </div>
      <button type="button" className="btn-retake" onClick={onRetake}>
        Retake
      </button>
    </div>
  )
}
