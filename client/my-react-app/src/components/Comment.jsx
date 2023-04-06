import React, { useState } from "react";
import IconBtn from "./IconBtn";
import { FaEdit, FaHeart, FaRegHeart, FaReply, FaTrash } from "react-icons/fa";
import { usePost } from "../contexts/PostContext";
import CommentList from "./CommentList";
import CommentForm from "./CommentForm";
import { useAsyncFn } from "../custom_hooks/useAsync";
import {
  createComment,
  deleteComment,
  updateComment,
  toggleCommentLikes,
} from "../services/comments";
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const Comment = ({ id, message, user, createdAt, likedByMe, likeCount }) => {
  const {
    post,
    getReplies,
    createLocalComment,
    updateLocalComment,
    toggleLocalCommentLike,
    deleteLocalComment,
  } = usePost();
  const createCommentFn = useAsyncFn(createComment);
  const updateCommentFn = useAsyncFn(updateComment);
  const deleteCommentFn = useAsyncFn(deleteComment);
  const toggleCommentLikeFn = useAsyncFn(toggleCommentLikes);

  const childComments = getReplies(id);

  const [areChildrenHidden, setAreChildrenHidden] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  function onCommentUpdate(message) {
    return updateCommentFn
      .execute({ postId: post.id, message, id })
      .then((comment) => {
        setIsEditing(false);
        updateLocalComment(id, comment.message);
      });
  }
  function onCommentReply(message) {
    return createCommentFn
      .execute({ postId: post.id, message, parentId: id })
      .then((comment) => {
        setIsReplying(false);
        createLocalComment(comment);
      });
  }
  function onCommentDelete() {
    return deleteCommentFn
      .execute({ postId: post.id, id })
      .then((comment) => deleteLocalComment(comment.id));
  }
  function onToggleCommentLike() {
    return toggleCommentLikeFn
      .execute({ postId: post.id, id })
      .then(({ addLike }) => toggleLocalCommentLike(id, addLike)); // after execution u update the state to reflect the frontend changes
  }

  return (
    <>
      <div className="comment">
        <div className="header">
          <span className="name">{user.name}</span>
          <span className="date">
            {dateFormatter.format(Date.parse(createdAt))}
          </span>
        </div>
        {isEditing ? (
          <CommentForm
            autoFocus
            loading={updateCommentFn.loading}
            error={updateCommentFn.error}
            onSubmit={onCommentUpdate}
            initialValue={message}
          />
        ) : (
          <div className="message">{message}</div>
        )}
        <div className="footer">
          <IconBtn
            onClick={onToggleCommentLike}
            disabled={toggleCommentLikeFn.loading}
            Icon={likedByMe ? FaHeart : FaRegHeart}
            aria-label={likedByMe ? "Unlike" : "Like"}
          >
            {likeCount}
          </IconBtn>
          <IconBtn
            onClick={() => setIsReplying((prev) => !prev)}
            Icon={FaReply}
            aria-label={isReplying ? "Cancel Reply" : "Reply"}
          ></IconBtn>

          <IconBtn
            onClick={() => setIsEditing((prev) => !prev)}
            Icon={FaEdit}
            aria-label={isEditing ? "Editing" : "Cancel Editing"}
          ></IconBtn>
          {/* this danger is from the css */}
          <IconBtn
            disable={deleteCommentFn.loading}
            Icon={FaTrash}
            aria-label="Delete"
            color="danger"
            onClick={onCommentDelete}
          ></IconBtn>
          {deleteCommentFn.error && (
            <div className="error-msg mt-1">{deleteCommentFn.error}</div>
          )}
        </div>
      </div>
      {isReplying && (
        <div className="mt-1 ml-3">
          <CommentForm
            autoFocus
            onSubmit={onCommentReply}
            loading={createCommentFn.loading}
            error={createCommentFn.error}
          />
        </div>
      )}
      {childComments?.length > 0 && (
        <>
          <div
            className={`nested-comments-stack ${
              areChildrenHidden ? "hide" : ""
            }`}
          >
            <button
              className="collapse-line"
              aria-label="Hide Replies"
              onClick={() => setAreChildrenHidden(true)}
            ></button>
            <div className="nested-comments">
              <CommentList comments={childComments} />
            </div>
          </div>
          <button
            className={`btn mt-1 ${!areChildrenHidden ? "hide" : ""}`}
            onClick={() => setAreChildrenHidden(false)}
          >
            Show Replies
          </button>
        </>
      )}
    </>
  );
};

export default Comment;
