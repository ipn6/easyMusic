import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Provincia {
  idProvincia: number;
  nombre: string;
}

interface Instrumento{
  idInstrumento: number;
  nombre: string;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  user = { nombre: '', email: '', password: '', confirmPassword: '', biografia: '', telefono: '', rol: '', idProvincia: null,
    idInstrumento: null, nivelMusical: '', coche: '0', fundacion: ''
   };

  provincias: Provincia[] = [];
  instrumentos: Instrumento[] = [];
  private apiUrl =  environment.apiUrl;
  previewUrl: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;



  constructor(private authService: AuthService, private http: HttpClient, private router: Router) {}

  onSubmit() {
    const formData = new FormData();
  
    // Añadir todos los campos de texto
    for (const key in this.user) {
      if (this.user.hasOwnProperty(key)) {
        formData.append(key, (this.user as any)[key]);
      }
    }
  
    // Añadir la imagen si se ha seleccionado
    if (this.selectedFile) {
      formData.append('foto', this.selectedFile);
    }
  
    // Enviar a través del servicio
    this.authService.register(formData).subscribe(
      res => {
        alert("Usuario registrado con éxito");
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        this.router.navigate(['/perfil']);
      },
      err => alert("Error en el registro")
    );
  }
  

  ngOnInit(){
    this.cargarProvincias();
    this.cargarInstrumentos();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
  
      // Para mostrar vista previa
      const reader = new FileReader();
      reader.onload = e => this.previewUrl = reader.result;
      reader.readAsDataURL(file);
    }
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

}
