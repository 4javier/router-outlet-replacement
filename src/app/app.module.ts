import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { BlueComponent } from './blue/blue.component';
import { RedComponent } from './red/red.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BlackComponent } from './black/black.component';
import { NgxRouterOutletAnimatorDirective } from './ngx-router-outlet-animator/ngx-router-outlet-animator.directive';
import { NgxRoaWrapperComponent } from './ngx-router-outlet-animator/ngx-roa-wrapper/ngx-roa-wrapper.component';

const routes = [
  { path: 'blue', component: BlueComponent },
  { path: 'red', component: RedComponent },
  { path: 'black', component: BlackComponent }
];
@NgModule({
  imports:  [
     RouterModule.forRoot(routes),
     BrowserAnimationsModule 
  ],
  declarations: [
     AppComponent,
     NgxRoaWrapperComponent,
     NgxRouterOutletAnimatorDirective
  ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
