import './polyfills';

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

type AngularWindow = Window &
  typeof globalThis & {
    ngRef: {
      destroy: () => void;
    };
  };

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then((ref) => {
    // Ensure Angular destroys itself on hot reloads.
    const ngWindow = window as AngularWindow;
    if (ngWindow.ngRef) {
      ngWindow.ngRef.destroy();
    }
    ngWindow.ngRef = ref;

    // Otherwise, log the boot error
  })
  .catch((err) => console.error(err));
