import React from 'react';
import Area from '../ui/area';

export default ({errors}) => (
  <div className='fieldPillContainer'>
    <h6 className='mt-05 mb-05'>Some errors happened</h6>
    <Area value={errors} type='danger' javascript={false}/>
  </div>
)
