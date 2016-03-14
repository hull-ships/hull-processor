import React from 'react';

export default ({title, children}) => (
  <div className="flexRow">
    <h6 className="mb-0 mt-05 text-muted flexGrow">{title}</h6>
    {children}
  </div>
)
