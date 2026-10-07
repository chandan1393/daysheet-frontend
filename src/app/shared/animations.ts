import { animate, group, query, stagger, style, transition, trigger } from '@angular/animations';

const easeOut = 'cubic-bezier(.2,.8,.2,1)';

/** Page change inside the app shell: old page leaves instantly, new one rises in. */
export const routeAnimation = trigger('routeAnim', [
  transition('* <=> *', [
    query(':leave', style({ display: 'none' }), { optional: true }),
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(10px)' }),
      animate(`320ms ${easeOut}`, style({ opacity: 1, transform: 'none' }))
    ], { optional: true })
  ])
]);

/** Rows and cards arrive one after another when a list first renders or grows. */
export const listStagger = trigger('listStagger', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(8px)' }),
      stagger(35, animate(`300ms ${easeOut}`, style({ opacity: 1, transform: 'none' })))
    ], { optional: true })
  ])
]);

export const fadeSlide = trigger('fadeSlide', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(6px)' }),
    animate(`240ms ${easeOut}`, style({ opacity: 1, transform: 'none' }))
  ]),
  transition(':leave', [
    animate('160ms ease-in', style({ opacity: 0, transform: 'translateY(-4px)' }))
  ])
]);

/** Steps in a wizard slide horizontally in the direction of travel. */
export const stepSlide = trigger('stepSlide', [
  transition(':increment', [
    query(':enter', style({ opacity: 0, transform: 'translateX(28px)' }), { optional: true }),
    query(':leave', style({ position: 'absolute', inset: 0 }), { optional: true }),
    group([
      query(':leave', animate(`200ms ease-in`, style({ opacity: 0, transform: 'translateX(-28px)' })), { optional: true }),
      query(':enter', animate(`360ms 80ms ${easeOut}`, style({ opacity: 1, transform: 'none' })), { optional: true })
    ])
  ]),
  transition(':decrement', [
    query(':enter', style({ opacity: 0, transform: 'translateX(-28px)' }), { optional: true }),
    query(':leave', style({ position: 'absolute', inset: 0 }), { optional: true }),
    group([
      query(':leave', animate(`200ms ease-in`, style({ opacity: 0, transform: 'translateX(28px)' })), { optional: true }),
      query(':enter', animate(`360ms 80ms ${easeOut}`, style({ opacity: 1, transform: 'none' })), { optional: true })
    ])
  ])
]);
