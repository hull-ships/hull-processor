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

  const cls = classnames({
    [styles.responsive]: !!pp.responsive,
    [styles.large]: !!pp.large,
    [styles.medium]: !!pp.medium,
    [className]: !!className,
    [styles.icon]: true,
    [styles.colorized]: !!colorize
  });
  return <SVGIcon src={src} className={cls} {...pp} />;
}
