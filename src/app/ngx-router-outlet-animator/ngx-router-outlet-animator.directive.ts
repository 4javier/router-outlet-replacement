import {
  Attribute,
  ComponentRef,
  Directive,
  ViewContainerRef,
  TemplateRef,
ChangeDetectorRef,
EnvironmentInjector,
ComponentFactoryResolver,
OnDestroy,
OnInit,
Output,
EventEmitter,
} from '@angular/core';
import { ActivatedRoute, ChildrenOutletContexts, Data, PRIMARY_OUTLET, RouterOutlet, RouterOutletContract } from '@angular/router';

import { NgxRoaWrapperComponent } from './ngx-roa-wrapper/ngx-roa-wrapper.component';


@Directive({
  selector: '[ngx-animated-router-outlet]',
  exportAs: 'animated-outlet',
})
export class NgxRouterOutletAnimatorDirective implements OnDestroy, OnInit, RouterOutletContract {
  private activated: ComponentRef<any>|null = null;
  private _activatedRoute: ActivatedRoute|null = null;
  private name: string;
  private wrapperCompRef!: ComponentRef<NgxRoaWrapperComponent>;

  @Output('activate') activateEvents = new EventEmitter<any>();
  @Output('deactivate') deactivateEvents = new EventEmitter<any>();
  /**
   * Emits an attached component instance when the `RouteReuseStrategy` instructs to re-attach a
   * previously detached subtree.
   **/
  @Output('attach') attachEvents = new EventEmitter<unknown>();
  /**
   * Emits a detached component instance when the `RouteReuseStrategy` instructs to detach the
   * subtree.
   */
  @Output('detach') detachEvents = new EventEmitter<unknown>();

  constructor(
      private parentContexts: ChildrenOutletContexts, private location: ViewContainerRef,
      @Attribute('name') name: string, private changeDetector: ChangeDetectorRef,
      private environmentInjector: EnvironmentInjector,
      private hostContainer: ViewContainerRef,
      private routerOutletTpl: TemplateRef<RouterOutlet>,) {
    this.name = name || PRIMARY_OUTLET;
    parentContexts.onChildOutletCreated(this.name, this);
  }

  /** @nodoc */
  ngOnDestroy(): void {
    // Ensure that the registered outlet is this one before removing it on the context.
    if (this.parentContexts.getContext(this.name)?.outlet === this) {
      this.parentContexts.onChildOutletDestroyed(this.name);
    }
  }

  /** @nodoc */
  ngOnInit(): void {
    if (!this.activated) {
      // If the outlet was not instantiated at the time the route got activated we need to populate
      // the outlet when it is initialized (ie inside a NgIf)
      const context = this.parentContexts.getContext(this.name);
      if (context && context.route) {
        if (context.attachRef) {
          // `attachRef` is populated when there is an existing component to mount
          this.attach(context.attachRef, context.route);
        } else {
          // otherwise the component defined in the configuration is created
          this.activateWith(context.route, context.injector);
        }
      }
    }
    this.wrapperCompRef = this.hostContainer.createComponent(NgxRoaWrapperComponent);
    this.wrapperCompRef.instance.routerOutletTpl = this.routerOutletTpl;
    this.wrapperCompRef.instance.outletName = this.name;
  }

  get isActivated(): boolean {
    return !!this.activated;
  }

  /**
   * @returns The currently activated component instance.
   * @throws An error if the outlet is not activated.
   */
  get component(): Object {
    if (!this.activated)
      throw Error('Outlet is not activated');
    return this.activated.instance;
  }

  get activatedRoute(): ActivatedRoute {
    if (!this.activated)
      throw Error('Outlet is not activated');
    return this._activatedRoute as ActivatedRoute;
  }

  get activatedRouteData(): Data {
    if (this._activatedRoute) {
      return this._activatedRoute.snapshot.data;
    }
    return {};
  }

  /**
   * Called when the `RouteReuseStrategy` instructs to detach the subtree
   */
  detach(): ComponentRef<any> {
    if (!this.activated)
      throw Error('Outlet is not activated');
    this.location.detach();
    const cmp = this.activated;
    this.activated = null;
    this._activatedRoute = null;
    this.detachEvents.emit(cmp.instance);
    return cmp;
  }

  /**
   * Called when the `RouteReuseStrategy` instructs to re-attach a previously detached subtree
   */
  attach(ref: ComponentRef<any>, activatedRoute: ActivatedRoute) {
    this.activated = ref;
    this._activatedRoute = activatedRoute;
    this.location.insert(ref.hostView);
    this.attachEvents.emit(ref.instance);
  }

  deactivate(): void {
    if (this.activated) {
      const c = this.component;
      this.activated.destroy();
      this.activated = null;
      this._activatedRoute = null;
      this.deactivateEvents.emit(c);
    }
  }

  activateWith(
      activatedRoute: ActivatedRoute,
      resolverOrInjector?: ComponentFactoryResolver|EnvironmentInjector|null) {
    if (this.isActivated) {
      throw Error('Cannot activate an already activated outlet');
    }
    this._activatedRoute = activatedRoute;
    const location = this.location;
    const snapshot = activatedRoute._futureSnapshot;
    const component = snapshot.component!;
    const childContexts = this.parentContexts.getOrCreateContext(this.name).children;
    const injector = new OutletInjector(activatedRoute, childContexts, location.injector);

    if (resolverOrInjector && isComponentFactoryResolver(resolverOrInjector)) {
      const factory = resolverOrInjector.resolveComponentFactory(component);
      this.activated = location.createComponent(factory, location.length, injector);
    } else {
      const environmentInjector = resolverOrInjector ?? this.environmentInjector;
      this.activated = location.createComponent(
          component, {index: location.length, injector, environmentInjector});
    }
    // Calling `markForCheck` to make sure we will run the change detection when the
    // `RouterOutlet` is inside a `ChangeDetectionStrategy.OnPush` component.
    this.changeDetector.markForCheck();
    this.activateEvents.emit(this.activated.instance);
  }
  
}


