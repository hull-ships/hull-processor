'use strict';
/* global module,import */

import React, { Component } from 'react';
import classnames from 'classnames';
import SVGIcon from 'svg-inline-react';
import styles from './icon.css';
import icons from './icon_list';

export default (props)=>{
  const pp = _.omit(props, 'styles');
  const { name , color, style, colorize, className } = pp;
  const src = icons[name];
  if (!src) {
    return <i/>;
  }
  pp.size = pp.size || 16
  let customStyle = {};
  if (color) {
    customStyle = {...style, color};
  }

  const cls = classnames({
    [className]: true,
    [styles.icon]: true,
    [styles.colorized]: !!colorize
  })
  return <SVGIcon src={src} className={cls} {...pp} style={customStyle} />;
}
