import { FaStar } from "react-icons/fa";

export default function Rating({ rating = 0, totalStars = 5, size = 14 }) {
  return (
    <div className="flex items-center space-x-0.5">
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <FaStar
            key={index}
            size={size}
            className={
              starValue <= rating ? "text-yellow-500 " : "text-gray-300"
            }
          />
        );
      })}
    </div>
  );
}
