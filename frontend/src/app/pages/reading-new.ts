import { Component, inject, signal } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { apiErrorMessage } from '../core/api-error';
import { MOMENTS } from '../core/labels';
import { MeasurementMoment } from '../core/models';
import { ReadingService } from '../core/reading.service';
import { notInFuture, toDateTimeLocal } from '../shared/validators';

@Component({
  selector: 'app-reading-new',
  imports: [ReactiveFormsModule],
  template: `
    <section class="card">
      <h1>Nouvelle mesure</h1>

      @if (error()) {
        <p class="alert alert-error" role="alert">{{ error() }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="value">Glycémie</label>
          <div class="input-suffix">
            <input
              id="value"
              type="number"
              inputmode="decimal"
              step="0.1"
              min="1"
              max="33.3"
              formControlName="value"
              class="input-xl"
              placeholder="5,4"
            />
            <span>mmol/L</span>
          </div>
          @if (form.controls.value.invalid && form.controls.value.touched) {
            <p class="field-error">Saisissez une valeur entre 1,0 et 33,3 mmol/L.</p>
          }
        </div>

        <fieldset class="field">
          <legend>Moment de la mesure</legend>
          <div class="moment-grid">
            @for (m of moments; track m.value) {
              <label class="moment-card" [class.selected]="form.controls.moment.value === m.value">
                <input type="radio" formControlName="moment" [value]="m.value" />
                <span class="moment-icon" aria-hidden="true">{{ m.icon }}</span>
                <span>{{ m.label }}</span>
              </label>
            }
          </div>
          @if (form.controls.moment.invalid && form.controls.moment.touched) {
            <p class="field-error">Choisissez le moment de la mesure.</p>
          }
        </fieldset>

        <div class="field">
          <label for="measuredAt">Date et heure</label>
          <input id="measuredAt" type="datetime-local" formControlName="measuredAt" />
          @if (form.controls.measuredAt.hasError('future')) {
            <p class="field-error">La date ne peut pas être dans le futur.</p>
          }
        </div>

        <div class="field">
          <label for="note">Note <span class="optional">(facultatif)</span></label>
          <input id="note" formControlName="note" maxlength="200" placeholder="Ex. après le sport" />
        </div>

        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
          {{ loading() ? 'Analyse…' : 'Analyser ma glycémie' }}
        </button>
      </form>
    </section>
  `,
})
export class ReadingNew {
  private readonly readings = inject(ReadingService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly moments = MOMENTS;

  protected readonly form = this.fb.group({
    value: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(33.3)]),
    moment: new FormControl<MeasurementMoment | null>(null, Validators.required),
    measuredAt: [toDateTimeLocal(new Date()), [Validators.required, notInFuture]],
    note: ['', Validators.maxLength(200)],
  });

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { value, moment, measuredAt, note } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    this.readings
      .create({
        value: value!,
        moment: moment!,
        measuredAt: new Date(measuredAt).toISOString(),
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
