import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AlertController, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent,
  IonGrid, IonRow, IonCol, IonList, IonListHeader, IonItem, IonLabel, IonItemSliding,
  IonItemOptions, IonItemOption, IonIcon, IonButton, IonInput, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonToast, IonBadge
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline, logOutOutline } from 'ionicons/icons';
import { SupabaseService } from '../services/supabase.service';
import { Client } from '../models/client.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent,
    IonGrid, IonRow, IonCol, IonList, IonListHeader, IonItem, IonLabel, IonItemSliding,
    IonItemOptions, IonItemOption, IonIcon, IonButton, IonInput, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonToast, IonBadge],
})
export class HomePage implements OnInit {
  private sb = inject(SupabaseService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);

  clients = signal<Client[]>([]);
  editingClientId = signal<string | null>(null);
  isAdmin = this.sb.isAdmin;
  toastMessage = signal('');
  isToastOpen = signal(false);

  clientForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    empresa: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    addIcons({ createOutline, trashOutline, logOutOutline });
  }

  async ngOnInit() {
    await this.loadClients();
  }

  async loadClients() {
    try {
      this.clients.set(await this.sb.getClients());
    } catch (e: any) {
      this.showToast('Error cargando clientes: ' + e.message);
    }
  }

  async saveClient() {
    if (this.clientForm.invalid) { this.clientForm.markAllAsTouched(); return; }
    const id = this.editingClientId();
    try {
      const value = this.clientForm.getRawValue();
      if (id) {
        await this.sb.updateClient(id, value);
        this.showToast('Cliente actualizado');
      } else {
        await this.sb.createClient(value);
        this.showToast('Cliente insertado');
      }
      this.resetForm();
      await this.loadClients();
    } catch (e: any) {
      this.showToast(e.code === '23505'
        ? 'Ya existe un cliente con ese email'
        : 'Error al guardar: ' + e.message);
    }
  }

  editClient(client: Client, sliding?: IonItemSliding) {
    sliding?.close();
    this.editingClientId.set(client.id!);
    this.clientForm.patchValue(client);
  }

  async confirmDelete(client: Client, sliding?: IonItemSliding) {
    sliding?.close();
    const alert = await this.alertCtrl.create({
      header: 'Eliminar cliente',
      message: `¿Seguro que quieres eliminar a ${client.nombre}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.deleteClient(client.id!) },
      ],
    });
    await alert.present();
  }

  async deleteClient(id: string) {
    try {
      await this.sb.deleteClient(id);
      this.showToast('Cliente eliminado');
      await this.loadClients();
    } catch (e: any) {
      this.showToast('Error eliminando: ' + e.message);
    }
  }

  async logout() {
    await this.sb.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  resetForm() {
    this.clientForm.reset();
    this.editingClientId.set(null);
  }

  setToastOpen(open: boolean) {
    this.isToastOpen.set(open);
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    this.isToastOpen.set(true);
  }
}