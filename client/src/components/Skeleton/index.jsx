import React from "react";
import ContentLoader from "react-content-loader";

const Skeleton = (props) => (
  <ContentLoader
    speed={2}
    width="100%"
    height={397}
    viewBox="0 0 100% 397"
    backgroundColor="#f3f3f3"
    foregroundColor="#ecebeb"
    {...props}
  >
    <rect x="-5" y="4" rx="0" ry="0" width="100%" height="330" />
    <rect x="2" y="344" rx="0" ry="0" width="72" height="14" />
    <rect x="84" y="344" rx="0" ry="0" width="72" height="14" />
    <rect x="2" y="365" rx="0" ry="0" width="110" height="11" />
    <rect x="2" y="379" rx="0" ry="0" width="91" height="11" />
  </ContentLoader>
);

export default Skeleton;
