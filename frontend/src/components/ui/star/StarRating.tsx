import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

interface StarRatingProps {
  rating: number; // e.g. 4.6, 3.5, 2
  varient?: string;
  maxStars?: number; // default 5
}

const StarRating = ({ rating, varient, maxStars = 5 }: StarRatingProps) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => {
        const starIndex = i + 1;

        if (rating >= starIndex) {
          // পুরো yellow star
          return <FaStar key={i} className="text-accent" />;
        } else if (rating >= starIndex - 0.5) {
          // Half star
          return <FaStarHalfAlt key={i} className="text-accent" />;
        } else {
          // Gray empty star
          return <FaRegStar key={i} className="text-text-tertiary" />;
        }
      })}
    </div>
  );
};

export default StarRating;
