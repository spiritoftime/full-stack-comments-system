import { useState } from "react";

import "./App.css";
import { PostList } from "./components/PostLists";
import { Route, Routes } from "react-router-dom";
import Post from "./components/Post";
import PostProvider from "./contexts/PostContext";

function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="container">
      <Routes>
        <Route path="/" element={<PostList />} />
        <Route
          path="/posts/:id"
          element={
            <PostProvider>
              <Post />
            </PostProvider>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
