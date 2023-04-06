import fastify from "fastify";
import dotenv from "dotenv";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { PrismaClient } from "@prisma/client";
import cookie from "@fastify/cookie";
dotenv.config();
const app = fastify();
app.register(sensible);
app.register(cookie, { secret: process.env.COOKIE_SECRET });

app.register(cors, { origin: process.env.CLIENT_URL, credentials: true });

// basically app.use, like a middleware
app.addHook("onRequest", (req, res, done) => {
  if (req.cookies.userId !== CURRENT_USER_ID) {
    req.cookies.userId = CURRENT_USER_ID;
    res.clearCookie("userId");
    res.setCookie("userId", CURRENT_USER_ID, {
      sameSite: "none",
      secure: true,
    });
  }
  done();
});

const COMMENT_SELECT_FIELDS = {
  id: true,
  message: true,
  parentId: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
    },
  },
};
const prisma = new PrismaClient();
const CURRENT_USER_ID = (
  await prisma.user.findFirst({ where: { name: "Kyle" } })
).id;
// get all posts
app.get("/posts", async (req, res) => {
  return await commitToDb(
    prisma.post.findMany({ select: { id: true, title: true } })
  );
});
//  get info about a post
app.get("/posts/:id", async (req, res) => {
  return await commitToDb(
    prisma.post
      .findUnique({
        where: { id: req.params.id },
        select: {
          body: true,
          title: true,
          comments: {
            orderBy: {
              createdAt: "desc",
            },
            select: {
              ...COMMENT_SELECT_FIELDS,
              _count: { select: { likes: true } },
            },
          },
        },
      })
      .then(async (post) => {
        const likes = await prisma.like.findMany({
          where: {
            userId: req.cookies.userId,
            commentId: { in: post.comments.map((comment) => comment.id) },
            // find all the likes data where the commentId of the like is a comment in the post
          },
        });
        return {
          ...post,
          comments: post.comments.map((comment) => {
            const { _count, ...commentFields } = comment;
            return {
              ...commentFields,
              likedByMe: likes.find((like) => like.commentId === comment.id),
              likeCount: _count.likes, // _count returns {likes:0}
            };
          }),
        };
      })
  );
});
// create comment
app.post("/posts/:id/comments", async (req, res) => {
  if (req.body.message === "" || req.body.message == null) {
    return res.send(app.httpErrors.badRequest("Message is required"));
  }
  return await commitToDb(
    prisma.comment
      .create({
        data: {
          message: req.body.message,
          userId: req.cookies.userId,
          parentId: req.body.parentId,
          postId: req.params.id,
        },
        select: COMMENT_SELECT_FIELDS,
      })
      .then((comment) => {
        return { ...comment, likeCount: 0, likedByMe: false };
      })
  );
});
// edit comment
app.put("/posts/:postId/comments/:commentId", async (req, res) => {
  const { userId } = await prisma.comment.findUnique({
    where: { id: req.params.commentId },
    select: { userId: true },
  });
  if (userId !== req.cookies.userId) {
    return res.send(
      app.httpErrors.unauthorized(
        "You do not have permission to edit this message"
      )
    );
  }
  return await commitToDb(
    prisma.comment.update({
      where: { id: req.params.commentId },
      data: { message: req.body.message },
      select: { message: true },
    })
  );
});
// delete comment
app.delete("/posts/:postId/comments/:commentId", async (req, res) => {
  const { userId } = await prisma.comment.findUnique({
    where: { id: req.params.commentId },
    select: { userId: true },
  });
  if (userId !== req.cookies.userId) {
    return res.send(
      app.httpErrors.unauthorized(
        "You do not have permission to delete this message"
      )
    );
  }
  return await commitToDb(
    prisma.comment.delete({
      where: { id: req.params.commentId },
      select: { id: true },
    })
  );
});
// like or unlike
app.post("/posts/:postId/comments/:commentId/toggleLike", async (req, res) => {
  const data = {
    commentId: req.params.commentId,
    userId: req.cookies.userId,
  };

  const like = await prisma.like.findUnique({
    // find the like by the user
    where: { userId_commentId: data },
  });

  if (like == null) {
    return await commitToDb(prisma.like.create({ data })).then(() => {
      return { addLike: true }; // for the frontend to know the color for the like button
    });
  } else {
    return await commitToDb(
      prisma.like.delete({ where: { userId_commentId: data } })
    ).then(() => {
      return { addLike: false };
    });
  }
});
async function commitToDb(promise) {
  const [error, data] = await app.to(promise);
  if (error) return app.httpErrors.internalServerError(error.message);
  return data;
}
app.listen({ port: process.env.PORT });
