import ReactMarkdown from "react-markdown";
import { Shield, User, Loader2, CheckCircle, AlertOctagon } from "lucide-react";
import vigilLogo from "@/assets/vigil-logo.png";

export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "streaming" | "complete" | "error";

export interface ChatMessageData {
  id: string;
  role: MessageRole;
  content: string;
  status?: MessageStatus;
  timestamp: Date;
}

interface ChatMessageProps {
  message: ChatMessageData;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div className={`animate-fade-in-up flex gap-3 px-5 py-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-7 h-7 rounded-md bg-primary/8 border border-primary/15 flex items-center justify-center overflow-hidden">
            <img src={vigilLogo} alt="" className="w-4 h-4 object-contain" />
          </div>
        </div>
      )}

      <div className={`max-w-[78%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? "bg-secondary border border-border"
          : "bg-card border border-border"
      }`}>
        <div className="prose prose-sm prose-invert max-w-none
          [&_code]:font-mono [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-primary [&_code]:text-xs
          [&_pre]:bg-muted [&_pre]:border [&_pre]:border-border [&_pre]:rounded-md [&_pre]:text-xs
          [&_pre_code]:bg-transparent [&_pre_code]:p-0
          [&_p]:text-foreground [&_p]:leading-relaxed [&_p]:my-2
          [&_li]:text-foreground [&_li]:my-0.5
          [&_strong]:text-primary [&_strong]:font-semibold
          [&_h1]:text-foreground [&_h1]:text-base [&_h1]:font-semibold [&_h1]:mt-4 [&_h1]:mb-2
          [&_h2]:text-foreground [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5
          [&_h3]:text-foreground [&_h3]:text-sm [&_h3]:font-medium [&_h3]:mt-2 [&_h3]:mb-1
          [&_table]:text-xs [&_table]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-muted-foreground [&_th]:font-mono [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-[10px]
          [&_td]:px-3 [&_td]:py-1.5 [&_td]:border-border
          [&_blockquote]:border-primary/30 [&_blockquote]:text-muted-foreground
          [&_hr]:border-border
          [&_ul]:my-1 [&_ol]:my-1
        ">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          {message.status === "streaming" && (
            <div className="flex items-center gap-1.5 text-terminal-dim">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-[10px] font-mono tracking-wider uppercase">analyzing</span>
            </div>
          )}
          {message.status === "complete" && !isUser && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle className="w-3 h-3" />
              <span className="text-[10px] font-mono">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
          {message.status === "error" && (
            <div className="flex items-center gap-1.5 text-destructive">
              <AlertOctagon className="w-3 h-3" />
              <span className="text-[10px] font-mono">error</span>
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-7 h-7 rounded-md bg-secondary border border-border flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
