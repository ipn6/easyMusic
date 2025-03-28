import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';


interface Provincia {
  idProvincia: number;
  nombre: string;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  user = { nombre: '', email: '', password: '', confirmPassword: '', telefono: '', rol: 'cliente', idProvincia: null as number | null,
    idInstrumento: '', nivelMusical: '', coche: '0', fundacion: ''
   };

  provincias: Provincia[] = [];
  provinciasFiltradas: Provincia[] = []; // Provincias filtradas según la búsqueda
  inputProvincia: string = ''; // Control del input
  private apiUrl = 'http://localhost:3000';


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
  }

  cargarProvincias() {
    this.http.get<Provincia[]>('http://localhost:3000/provincias').subscribe(
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

  seleccionarProvincia(provincia: Provincia) {
    this.inputProvincia = provincia.nombre;
    this.user.idProvincia = provincia.idProvincia;
    this.provinciasFiltradas = this.provincias; // Restablecer lista completa
  }

  
}
