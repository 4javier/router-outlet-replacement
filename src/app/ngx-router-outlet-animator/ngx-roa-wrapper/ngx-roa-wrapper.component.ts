import { AnimationBuilder, AnimationPlayer } from '@angular/animations';
import { Component, ElementRef, HostBinding, TemplateRef } from '@angular/core';
import { ChildrenOutletContexts, RouterOutlet } from '@angular/router';
import {
  BehaviorSubject, observeOn, asyncScheduler,
  filter, bufferToggle, windowToggle, merge, mergeAll,
  ReplaySubject, takeUntil, queueScheduler, animationFrameScheduler, asapScheduler, tap
} from 'rxjs';
import { ngxRoaEnterAnimationBuilder, ngxRoaExitAnimationBuilder } from '../ngx-roa-animations';

type AnimationState = 'clear' | 'rendered';

@Component({
  selector: 'ngx-roa-wrapper',
  templateUrl: './ngx-roa-wrapper.component.html',
  styleUrls: ['./ngx-roa-wrapper.component.css'],
})
export class NgxRoaWrapperComponent {

  private _animState: AnimationState = 'clear';
  private get animState() { return this._animState;}
  private set animState(newState: AnimationState) {
    this._animState = newState;

    if(newState === 'clear') {
  //    this.createExitAP().play()
      console.log('i')
    }
    else if (newState === 'rendered') {
      this.createEnterAP().play()
    }
  }

  @HostBinding('class.hide-first-sibling')
  private hideSync = false;

  private destroy$ = new ReplaySubject();

  routerOutletTpl!: TemplateRef<RouterOutlet>;
  outletName = '';
  
  private animStateSub$ = new BehaviorSubject<AnimationState>('clear');
  private animState$ = this.animStateSub$.asObservable().pipe(
    observeOn(asyncScheduler),
  )
  
  private animationPending$ = new BehaviorSubject<boolean>(false)
  private animationOn$ = this.animationPending$.pipe(filter(isPending => isPending))
  private animationOff$ = this.animationPending$.pipe(filter(isPending => !isPending))
  
  private exitAP: AnimationPlayer;
  constructor(
    private context: ChildrenOutletContexts,
    private animationBuilder: AnimationBuilder,
    private elementRef: ElementRef,) {
    this.exitAP = this.createExitAP();
    merge(
      this.animState$.pipe(
        bufferToggle(this.animationOn$, () => this.animationOff$),
        mergeAll(),
      ),
      this.animState$.pipe(
        windowToggle(this.animationOff$,  () => this.animationOn$),
        mergeAll(),
      )
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe(newState => this.animState = newState)
  }

  ngAfterViewInit() {
    this.context.getContext(this.outletName)?.outlet?.activateEvents?.pipe(
      takeUntil(this.destroy$))
    .subscribe(() => {
      console.log(this.animState)
      this.hideSync = true;
      this.animStateSub$.next('rendered');
    });

    this.context.getContext(this.outletName)?.outlet?.deactivateEvents?.pipe(
      observeOn(queueScheduler),
      takeUntil(this.destroy$),
      tap(()=>this.exitAP.play()))
    .subscribe(() =>  {  
      console.log(this.animState)   
//      this.animState = 'clear';
    
    })
  }

  createExitAP() {
    const exitAnimationPlayer = 
      this.animationBuilder
        .build(ngxRoaExitAnimationBuilder())
        .create(this.elementRef.nativeElement);

    exitAnimationPlayer.onStart(() => {
      this.hideSync = false;
      this.animationPending$.next(true)
      console.log('clear started')
    });
    
    exitAnimationPlayer.onDone(() => {
      console.log('clear ended')
      this.animationPending$.next(false);
    })
    exitAnimationPlayer.init();
    return exitAnimationPlayer
  }
  
  createEnterAP() {
    const enterAnimationPlayer = 
      this.animationBuilder
        .build(ngxRoaEnterAnimationBuilder())
        .create(this.elementRef.nativeElement);
      
    enterAnimationPlayer.onStart(() => {
      this.hideSync = false;
      this.animationPending$.next(true);
      console.log('rend started')
    });
    
    enterAnimationPlayer.onDone(() => {
      this.animationPending$.next(false);
      console.log('rend done '+ this.hideSync);
    })
  
    return enterAnimationPlayer
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}