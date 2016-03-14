import React from 'react';

export default ({title, children}) => (
  <div className="flexRow">
    <h6 className="mb-0 text-muted flexGrow">{title}</h6>
    {children}
  </div>
)
