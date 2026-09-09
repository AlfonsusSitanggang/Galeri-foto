import PhotoCard from "./PhotoCard";

/**
 * Komponen presentasional untuk menampilkan daftar foto dalam tata letak responsif CSS Grid.
 *
 * @param {object} props
 * @param {Array<object>} [props.photos=[]] - Daftar data foto yang akan ditampilkan.
 */
const PhotoGrid = ({ photos = [] }) => {
  // Jika array kosong atau tidak ada data, biarkan parent component menangani empty state
  if (!photos || photos.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          imageUrl={photo.imageUrl}
          title={photo.title}
          createdAt={photo.createdAt}
        />
      ))}
    </div>
  );
};

export default PhotoGrid;
