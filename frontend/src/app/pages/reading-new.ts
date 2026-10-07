import { Component, inject, signal } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { apiErrorMessage } from '../core/api-error';
import { parseDecimal } from '../core/format';
import { MOMENTS } from '../core/labels';
import { MeasurementMoment } from '../core/models';
import { ReadingService } from '../core/reading.service';
import { Icon } from '../shared/icon';
import { dateTimeNotInFuture, decimalInRange, toDateTimeLocal } from '../shared/validators';

@Component({
  selector: 'app-reading-new',
  imports: [ReactiveFormsModule, Icon],
  template: `
    <form class="page entry" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="page-intro">
        <h1>Nouvelle mesure</h1>
        <p class="wide">Entrez la valeur affichée sur votre lecteur de glycémie.</p>
      </div>

      @if (error()) {
        <div class="alert alert-error" role="alert">
          <app-icon name="errCircle" />
          <strong>{{ error() }}</strong>
        </div>
      }

      <div class="field">
        <label for="value" class="section-label">Valeur de la glycémie</label>
        <div class="value-box" [class.is-invalid]="!!valueError()">
          <input id="value" type="text" inputmode="decimal" autocomplete="off" placeholder="ex. 6.2" formControlName="value"
            [attr.aria-invalid]="!!valueError()" aria-describedby="value-hint value-error" />
          <span>mmol/L</span>
        </div>
        <p class="hint" id="value-hint">Valeur acceptée : de 1.0 à 33.3 mmol/L</p>
        @if (valueError(); as msg) {
          <p class="field-error" id="value-error"><app-icon name="errCircle" [size]="20" /><span>{{ msg }}</span></p>
        }
      </div>

      <fieldset class="group">
        <legend class="section-label">Moment de la mesure</legend>
        @if (momentError()) {
          <p class="field-error"><app-icon name="errCircle" [size]="20" /><span>Veuillez choisir le moment de la mesure.</span></p>
        }
        <div class="moments">
          @for (m of moments; track m.value) {
            <label class="moment" [class.selected]="form.controls.moment.value === m.value" [class.is-invalid]="momentError()">
              <input class="visually-hidden" type="radio" formControlName="moment" [value]="m.value" />
              <span class="moment-icon"><app-icon [name]="m.icon" [size]="26" /></span>
              <span class="moment-label">{{ m.label }}</span>
              <span class="moment-tick"><app-icon name="tick" [size]="18" [stroke]="3" /></span>
            </label>
          }
        </div>
      </fieldset>

      <fieldset class="group">
        <legend class="section-label">Date et heure</legend>
        <div class="datetime">
          <div class="field">
            <label for="date">Date</label>
            <input id="date" class="input" [class.is-invalid]="futureError()" type="date" formControlName="date" />
          </div>
          <div class="field">
            <label for="time">Heure</label>
            <input id="time" class="input" [class.is-invalid]="futureError()" type="time" formControlName="time" />
          </div>
        </div>
        @if (futureError()) {
          <p class="field-error"><app-icon name="errCircle" [size]="20" /><span>La date et l'heure ne peuvent pas être dans le futur.</span></p>
        } @else {
          <p class="hint">Préremplies à maintenant. Modifiez-les pour une mesure prise plus tôt.</p>
        }
      </fieldset>

      <div class="field">
        <label for="note">Note <span class="optional">(facultative)</span></label>
        <input id="note" class="input" formControlName="note" maxlength="200" placeholder="ex. après le sport" />
      </div>

      <button class="btn btn-primary submit" type="submit" [disabled]="loading()">
        {{ loading() ? 'Analyse…' : 'Analyser ma glycémie' }}
        <app-icon name="arrowRight" [size]="22" />
      </button>
    </form>
  `,
  styles: `
    .entry { gap: 36px; max-width: 860px; }
    .page-intro .wide { max-width: none; }
    .section-label { font-family: var(--font-heading); font-size: 22px !important; font-weight: 400 !important; }

    .value-box {
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 420px;
      min-height: 96px;
      padding: 0 30px;
      border: 2px solid var(--color-neutral-600);
      border-radius: 999px;
      background: var(--color-neutral-100);
    }
    .value-box:focus-within { border-color: var(--color-accent); }
    .value-box.is-invalid { border-color: var(--lvl-tres-eleve); }
    .value-box input {
      flex: 1;
      min-width: 0;
      padding: 0;
      border: 0;
      border-radius: 12px;
      background: transparent;
      color: var(--color-text);
      font-family: var(--font-heading);
      font-size: 58px;
      line-height: 1.1;
    }
    .value-box input:focus-visible { outline: none; }
    .value-box span { font-size: 20px; font-weight: 700; color: var(--color-neutral-700); }

    .group { display: flex; flex-direction: column; gap: 12px; min-width: 0; margin: 0; padding: 0; border: 0; }
    .group legend { padding: 0; margin-bottom: 12px; }

    .moments { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr)); gap: 12px; }
    .moment {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      min-height: 136px;
      padding: 18px;
      border: 2px solid var(--color-neutral-400);
      border-radius: 28px;
      background: var(--color-neutral-100);
      cursor: pointer;
    }
    .moment:hover { border-color: var(--color-accent-400); }
    .moment.is-invalid { border-color: var(--lvl-tres-eleve); }
    .moment:has(input:focus-visible) { outline: 2px solid var(--color-accent); outline-offset: 2px; }
    .moment.selected { border: 3px solid var(--color-accent); background: var(--color-accent-100); padding: 17px; }
    .moment-icon {
      display: grid;
      place-items: center;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: var(--color-accent-100);
      color: var(--color-accent-700);
    }
    .selected .moment-icon { background: var(--color-accent); color: var(--color-bg); }
    .moment-label { padding-right: 20px; font-size: 17px; font-weight: 700; line-height: 1.3; }
    .moment-tick {
      position: absolute;
      top: 14px;
      right: 14px;
      display: none;
      place-items: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: var(--color-accent);
      color: var(--color-bg);
    }
    .selected .moment-tick { display: grid; }

    .datetime { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr)); gap: 16px; max-width: 520px; }
    .datetime .input { padding: 0 18px; }

    .submit { width: 100%; max-width: 420px; min-height: 62px; font-size: 19px; }
  `,
})
export class ReadingNew {
  private readonly readings = inject(ReadingService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly moments = MOMENTS;

  /** Préremplissage à maintenant, recalculé à chaque ouverture de la page. */
  private readonly now = toDateTimeLocal(new Date());

  protected readonly form = this.fb.group(
    {
      value: ['', [Validators.required, decimalInRange(1, 33.3)]],
      moment: new FormControl<MeasurementMoment | null>(null, Validators.required),
      date: [this.now.slice(0, 10), Validators.required],
      time: [this.now.slice(11), Validators.required],
      note: ['', Validators.maxLength(200)],
    },
    { validators: dateTimeNotInFuture('date', 'time') },
  );

  protected readonly loading = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal<string | null>(null);

  protected valueError(): string | null {
    const c = this.form.controls.value;
    if (!c.touched || c.valid) return null;
    return c.hasError('required')
      ? 'Veuillez entrer la valeur de votre glycémie.'
      : 'La valeur doit se situer entre 1.0 et 33.3 mmol/L. Vérifiez le chiffre affiché sur votre lecteur.';
  }

  protected momentError(): boolean {
    return this.submitted() && this.form.controls.moment.invalid;
  }

  protected futureError(): boolean {
    return this.form.hasError('future');
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { value, moment, date, time, note } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    this.readings
      .create({
        value: parseDecimal(value)!,
        moment: moment!,
        measuredAt: new Date(`${date}T${time}`).toISOString(),
        note: note.trim() || undefined,
      })
      .subscribe({
        next: (reading) => this.router.navigate(['/mesures', reading.id]),
        error: (err) => {
          this.error.set(apiErrorMessage(err));
          this.loading.set(false);
        },
      });
  }
}
