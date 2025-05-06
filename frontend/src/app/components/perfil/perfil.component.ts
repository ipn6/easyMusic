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
  instrumentos: Instrumento[] = [];
  provincias: Provincia[] = [];
  newPassword: string = '';
  previewImage: string | null = null;
  private apiUrl =  environment.apiUrl;
  fotoSeleccionada: File | null = null;
  fotoUrl: string = ''; // URL de la foto de perfil


  constructor(private authService: AuthService, private http: HttpClient, private router: Router) {
  }

  ngOnInit() {
    this.user = this.authService.getUser();
    this.cargarProvincias();
    this.cargarInstrumentos();
  }

  getFotoUrl(id: number): string {
    return `${this.apiUrl}/usuario/${id}/foto`; 
  }

  cargarProvincias() {
    this.http.get<Provincia[]>(`${this.apiUrl}/provincias`).subscribe(
      (data) => {
        this.provincias = data;
      },
      (error) => console.error('Error al cargar provincias', error)
    );
  }

  // Método para cargar los instrumentos desde el servidor
  cargarInstrumentos() {
    this.http.get<Instrumento[]>(`${this.apiUrl}/instrumentos`).subscribe(
      (data) => {
        this.instrumentos = data;
      },
      (error) => console.error('Error al cargar instrumentos', error)
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


    this.http.post(`${this.apiUrl}/perfil`, formData, {
      headers: {
        'user-id': this.user.idUsuario,
      }
    }).subscribe(response => {
      this.authService.setUser(this.user); // Actualizar el usuario en el servicio
      this.getFotoUrl(this.user.idUsuario); // Actualizar la URL de la foto
      this.router.navigate(['/perfil']); 
      alert('Perfil actualizado correctamente');
    }, error => {
      console.error(' Error al actualizar perfil:', error);
    });
  }

  
  
}
