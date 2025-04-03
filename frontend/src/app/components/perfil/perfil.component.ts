import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface Provincia {
  idProvincia: number;
  nombre: string;
}

interface Instrumento {
  idInstrumento: number;
  nombre: string;
}

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  user: any = {};
  instrumento = '';
  provincia = '';
  instrumentos: Instrumento[] = [];
  provincias: Provincia[] = [];
  newPassword: string = '';
  previewImage: string | null = null;
  private apiUrl =  environment.apiUrl;
  fotoSeleccionada: File | null = null;


  constructor(private authService: AuthService, private http: HttpClient, private router: Router) {
  }

  ngOnInit() {
    this.loadUser();
  }

  loadUser() {
    this.user = this.authService.getUser();
    this.cargarFotoPerfil();
    console.log("Foto de perfil:", this.user.foto);

    this.getInstrumento(this.user.idInstrumento);
    this.getProvincia(this.user.idProvincia);
  }
  cargarFotoPerfil() {
    this.http.get(`${this.apiUrl}/perfil/foto`, {
      headers: new HttpHeaders({ 'user-id': this.user.idUsuario }),
      responseType: 'arraybuffer'
    }).subscribe(response => {
      const base64String = btoa(
        new Uint8Array(response).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      this.user.foto = `data:image/jpeg;base64,${base64String}`;
    }, error => {
      console.error('Error al cargar la foto:', error);
    });
  }

  getInstrumento(id: number) {
    this.http.get<Instrumento[]>(`${this.apiUrl}/instrumentos`).subscribe(
      (data) => {
        this.instrumentos = data;
        const instrumento = this.instrumentos.find(i => i.idInstrumento === id);
        this.instrumento = instrumento ? instrumento.nombre : 'No disponible';
      },
      (error) => console.error('Error al cargar instrumentos', error)
    );
  }

  getProvincia(id: number) {
    this.http.get<Provincia[]>(`${this.apiUrl}/provincias`).subscribe(
      (data) => {
        this.provincias = data;
        const provincia = this.provincias.find(p => p.idProvincia === id);
        this.provincia = provincia ? provincia.nombre : 'No disponible';
      },
      (error) => console.error('Error al cargar provincias', error)
    );
  }

  // Manejar selección de imagen
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.fotoSeleccionada = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // Actualizar perfil
  actualizarPerfil() {
    const formData = new FormData();
    formData.append('nombre', this.user.nombre);
    formData.append('telefono', this.user.telefono);
    formData.append('biografia', this.user.biografia);
    
    if (this.newPassword) {
      formData.append('password', this.newPassword);
    }

    if (this.fotoSeleccionada) {
      formData.append('foto', this.fotoSeleccionada);
    }

    console.log('📤 Enviando FormData:');
    for (const pair of (formData as any).entries()) {
      console.log(pair[0] + ':', pair[1]);
    }

    this.http.post(`${this.apiUrl}/perfil`, formData, {
      headers: {
        'user-id': this.user.idUsuario,
      }
    }).subscribe(response => {
      console.log('✅ Perfil actualizado:', response);
      // Actualizar el usuario en el servicio AuthService
      this.authService.setUser(this.user); // Actualizar el usuario en el servicio
      this.cargarFotoPerfil();
      this.router.navigate(['/perfil']); 
      alert('Perfil actualizado correctamente');
    }, error => {
      console.error('🚨 Error al actualizar perfil:', error);
    });
  }
  
}
