import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol,
  IonCard, IonCardContent, IonInput, IonButton, IonText
} from '@ionic/angular';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid,
    IonRow, IonCol, IonCard, IonCardContent, IonInput, IonButton, IonText],
})
export class LoginPage {
  private sb = inject(SupabaseService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loading = signal(false);
  errorMsg = signal('');

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');
    try {
      const { email, password } = this.form.getRawValue();
      await this.sb.login(email, password);
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch {
      this.errorMsg.set('Email o contraseña incorrectos');
    } finally {
      this.loading.set(false);
    }
  }
}
