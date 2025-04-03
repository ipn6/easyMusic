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
  user = { nombre: '', email: '', password: '', confirmPassword: '', telefono: '', rol: 'cliente', idProvincia: 0,
    idInstrumento: 0, nivelMusical: '', coche: '0', fundacion: ''
   };

  provincias: Provincia[] = [];
  provinciasFiltradas: Provincia[] = []; // Provincias filtradas según la búsqueda
  inputProvincia: string = ''; // Control del input
  instrumentos: Instrumento[] = [];
  instrumentosFiltrados: Instrumento[] = [];
  inputInstrumento: string = '';
  private apiUrl =  environment.apiUrl;


  constructor(private authService: AuthService, private http: HttpClient, private router: Router) {}

  onSubmit() {
    this.authService.register(this.user).subscribe(res => {
      alert("Usuario registrado con éxito");
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      this.router.navigate(['/perfil']);
    }, err => alert("Error en el registro"));
  }

  ngOnInit(){
    this.cargarProvincias();
    this.cargarInstrumentos();
  }

  cargarProvincias() {
    this.http.get<Provincia[]>(`${this.apiUrl}/provincias`).subscribe(
      (data) => {
        this.provincias = data;
        this.provinciasFiltradas = data; // Inicialmente mostramos todas
      },
      (error) => console.error('Error al cargar provincias', error)
    );
  }

  filtrarProvincias() {
    this.provinciasFiltradas = this.provincias.filter(prov =>
      prov.nombre.toLowerCase().includes(this.inputProvincia.toLowerCase())
    );
  }

  asignarIdProvincia() {
    const provinciaSeleccionada = this.provincias.find(prov => prov.nombre === this.inputProvincia);
    if (provinciaSeleccionada) {
      this.user.idProvincia = provinciaSeleccionada.idProvincia;
    } else {
      this.user.idProvincia = 0; // Si no coincide, se pone en null
    }
  }

  // Método para cargar los instrumentos desde el servidor
  cargarInstrumentos() {
    this.http.get<Instrumento[]>(`${this.apiUrl}/instrumentos`).subscribe(
      (data) => {
        this.instrumentos = data;
        this.instrumentosFiltrados = data; // Inicialmente mostramos todas
      },
      (error) => console.error('Error al cargar instrumentos', error)
    );
  }

  filtrarInstrumentos() {
    this.instrumentosFiltrados = this.instrumentos.filter(inst =>
      inst.nombre.toLowerCase().includes(this.inputInstrumento.toLowerCase())
    );
  }

  asignarIdInstrumento() {
    const instrumentoSeleccionado = this.instrumentos.find(inst => inst.nombre === this.inputInstrumento);
    if (instrumentoSeleccionado) {
      this.user.idInstrumento = instrumentoSeleccionado.idInstrumento;
    } else {
      this.user.idInstrumento = 0; // Si no coincide, se pone en 0
    }
  }

  
}
