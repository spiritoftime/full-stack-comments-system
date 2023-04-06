import React from "react";
import { usePost } from "../contexts/PostContext";
import CommentList from "./CommentList";
import CommentForm from "./CommentForm";
import { useAsyncFn } from "../custom_hooks/useAsync";
import { createComment } from "../services/comments";

const Post = () => {
  const { post, rootComments, createLocalComment } = usePost();
  const {
    loading,
    error,
    execute: createCommentFn,
  } = useAsyncFn(createComment);
  function onCommentCreate(message) {
    return createCommentFn({ postId: post.id, message }).then((comment) => {
      createLocalComment(comment);
    });
  }
  return (
    <>
      <h1>{post.title}</h1>
      <article>{post.body}</article>
      <h3 className="comments-title">Comments</h3>
      <section>
        <CommentForm
          loading={loading}
          error={error}
          onSubmit={onCommentCreate}
        />
        {rootComments != null && rootComments.length > 0 && (
          <div className="mt-4">
            <CommentList comments={rootComments} />
          </div>
        )}
      </section>
    </>
  );
};

export default Post;
