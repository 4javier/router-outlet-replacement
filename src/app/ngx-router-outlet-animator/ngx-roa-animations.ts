import {
  animate,
  keyframes,
  query,
  style,
  transition,
  trigger,
} from '@angular/animations';

const defaultInAnimation = [
  animate(
    '500ms',
    keyframes([
      style({ transform: 'scale(0)' }),
      style({ transform: 'scale(1)' }),
    ])
  ),
];

const defaultOutAnimation = [
  animate(
    '3000ms',
    keyframes([
      style({ transform: 'scale(1)' }),
      style({ transform: 'scale(0)' }),
    ])
  ),
];


export const ngxRoaEnterAnimationBuilder =
  (enter = defaultInAnimation) => 
    query('ngx-roa-wrapper *:last-child', [
      style({ display: 'block' }),
      ...enter,
    ], { optional: true })

export const ngxRoaExitAnimationBuilder =
  (exit = defaultOutAnimation) =>
    query('router-outlet + *', [
      style({ display: 'block' }),
      ...exit,
    ], { optional: true });

