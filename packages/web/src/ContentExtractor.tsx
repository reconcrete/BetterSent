import { useState, type FormEvent } from "react";
import { api } from "./api/client";

type ProcessType = "url" | "text";

interface ProcessResponse {
  success: true;
  markdown: string;
  filename: string;
  savedAt: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

export function ContentExtractor() {
  const [type, setType] = useState<ProcessType>("url");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let response: any;

      if (type === "url") {
        const response = await api.extract.url.post({
          url: content.trim(),
        });
      } else {
        const response = await api.extract.text.post({
          textContent: content.trim(),
        });
      }

      if (response.data) {
        const data = response.data as ProcessResponse | ErrorResponse;
        if (data.success === true) {
          // Ensure savedAt is a string (Eden might deserialize it as Date)
          const result: ProcessResponse = {
            ...data,
            savedAt: typeof data.savedAt === "string" ? data.savedAt : new Date(data.savedAt).toISOString(),
          };
          setResult(result);
        } else {
          setError(data.error);
        }
      } else if (response.error) {
        // Handle Eden Treaty error structure
        const errorObj = response.error;
        const errorMessage =
          typeof errorObj === "object" && errorObj !== null && "value" in errorObj
            ? String(errorObj.value)
            : typeof errorObj === "string"
            ? errorObj
            : "An error occurred";
        setError(errorMessage);
      } else {
        setError("Unknown error occurred");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process content");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setContent("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="mt-8 mx-auto w-full max-w-4xl text-left flex flex-col gap-6">
      <div className="bg-[#1a1a1a] border-2 border-[#fbf0df] rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-[#fbf0df]">Content Extractor</h2>
        <p className="text-[#fbf0df]/70 mb-6">
          Extract and process content from a URL or paste text directly. The content will be processed using AI and
          saved as markdown.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="url"
                checked={type === "url"}
                onChange={(e) => setType(e.target.value as ProcessType)}
                className="w-4 h-4 text-[#fbf0df] bg-[#242424] border-[#fbf0df] focus:ring-[#f3d5a3]"
              />
              <span className="text-[#fbf0df]">URL</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="text"
                checked={type === "text"}
                onChange={(e) => setType(e.target.value as ProcessType)}
                className="w-4 h-4 text-[#fbf0df] bg-[#242424] border-[#fbf0df] focus:ring-[#f3d5a3]"
              />
              <span className="text-[#fbf0df]">Text</span>
            </label>
          </div>

          {type === "url" ? (
            <input
              type="url"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="https://example.com/article"
              required
              className="w-full bg-[#242424] border-2 border-[#fbf0df] rounded-lg p-3 text-[#fbf0df] font-mono text-base outline-none focus:border-[#f3d5a3] placeholder-[#fbf0df]/40"
            />
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your text content here..."
              required
              rows={8}
              className="w-full bg-[#242424] border-2 border-[#fbf0df] rounded-lg p-3 text-[#fbf0df] font-mono text-base resize-y outline-none focus:border-[#f3d5a3] placeholder-[#fbf0df]/40"
            />
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="bg-[#fbf0df] text-[#1a1a1a] border-0 px-6 py-2.5 rounded-lg font-bold transition-all duration-100 hover:bg-[#f3d5a3] hover:-translate-y-px cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? "Processing..." : "Process Content"}
            </button>
            {(result || error) && (
              <button
                type="button"
                onClick={handleReset}
                className="bg-[#242424] text-[#fbf0df] border-2 border-[#fbf0df] px-6 py-2.5 rounded-lg font-bold transition-all duration-100 hover:bg-[#1a1a1a] hover:border-[#f3d5a3] cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {loading && (
        <div className="bg-[#1a1a1a] border-2 border-[#fbf0df] rounded-xl p-6">
          <p className="text-[#fbf0df]">Processing your content...</p>
        </div>
      )}

      {error && (
        <div className="bg-[#1a1a1a] border-2 border-red-500 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-2 text-red-400">Error</h3>
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-[#1a1a1a] border-2 border-green-500 rounded-xl p-6 flex flex-col gap-4">
          <div>
            <h3 className="text-xl font-bold mb-2 text-green-400">Success!</h3>
            <div className="text-[#fbf0df]/70 text-sm space-y-1">
              <p>
                <span className="font-semibold">Filename:</span> {result.filename}
              </p>
              <p>
                <span className="font-semibold">Saved at:</span> {String(result.savedAt)}
              </p>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-2 text-[#fbf0df]">Extracted Markdown:</h4>
            <textarea
              readOnly
              value={result.markdown}
              rows={15}
              className="w-full bg-[#242424] border-2 border-[#fbf0df] rounded-lg p-3 text-[#fbf0df] font-mono text-sm resize-y outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
