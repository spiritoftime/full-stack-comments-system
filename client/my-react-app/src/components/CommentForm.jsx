import React, { useState } from "react";

const CommentForm = ({
  initialValue = "",
  loading,
  error,
  onSubmit,
  autoFocus = false,
}) => {
  const [message, setMessage] = useState(initialValue);
  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(message).then(() => setMessage(""));
  }
  return (
    <form onSubmit={handleSubmit}>
      <div className="comment-form-row">
        <textarea
          autoFocus={autoFocus}
          onChange={(e) => setMessage(e.target.value)}
          value={message}
          className="message-input"
        />
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Loading" : "Post"}
        </button>
      </div>
      <div className="error-msg">{error}</div>
    </form>
  );
};

export default CommentForm;
