interface Comment {
  id: string;
  name: string;
  text: string;
  time: string;
  avatar?: string;
}

interface Props {
  comments: Comment[];
  isLoading?: boolean;
}

export default function CommentList({ comments, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-10 text-sm">
        লোড হচ্ছে...
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-10 text-text-tertiary text-sm">
        কোনো মন্তব্য নেই
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center text-xs font-semibold text-text-secondary">
            {comment.name[0]}
          </div>

          <div className="flex-1 min-w-0">
            <div className="bg-background-secondary rounded-2xl rounded-tl-sm px-3 py-2.5">
              <p className="text-xs font-semibold text-text-primary">
                {comment.name}
              </p>
              <p className="text-sm text-text-primary mt-0.5 leading-relaxed">
                {comment.text}
              </p>
            </div>

            <p className="text-xs text-text-tertiary mt-1 px-1">
              {comment.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
