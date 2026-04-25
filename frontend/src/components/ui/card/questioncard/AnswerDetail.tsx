import type { Answer } from "@/types/answer/answerTypes";

export function AnswerDetail({ answer }: { answer: Answer }) {
  return (
    <div className="flex flex-col gap-4">
      {/* answer card */}
      <div className="bg-background rounded-2xl p-5">
        <p className="text-xs text-text-tertiary mb-3">উত্তর</p>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-background-secondary overflow-hidden shrink-0">
            {answer.userId.profileImage ? (
              <img
                src={answer.userId.profileImage}
                alt={answer.userId.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-text-secondary">
                {answer.userId.name?.[0]}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {answer.userId.name}
            </p>
          </div>
        </div>

        <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
          {answer.text}
        </p>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
          <div>
            <span className="font-medium text-sm">{answer.upvotesCount}</span>{" "}
            <span className="text-xs text-text-tertiary">ইতিবাচক</span>
          </div>
          <div>
            <span className="font-medium text-sm">{answer.downvotesCount}</span>{" "}
            <span className="text-xs text-text-tertiary">নেতিবাচক</span>
          </div>
          {answer.isBestAnswer && (
            <span className="ml-auto text-xs font-medium text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full">
              সেরা উত্তর ✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
