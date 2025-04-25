import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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
export class RegisterComponent implements OnInit{
  user = { nombre: '', email: '', password: '', confirmPassword: '', biografia: '', telefono: '', rol: '', idProvincia: null,
    idInstrumento: null, nivelMusical: '', coche: '0', fundacion: ''
   };

  provincias: Provincia[] = [];
  instrumentos: Instrumento[] = [];
  private apiUrl =  environment.apiUrl;
  previewUrl: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  registerForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;


  constructor(private authService: AuthService, private http: HttpClient,
     private router: Router, private fb: FormBuilder) {}

  
  

  ngOnInit(): void{
    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d).{8,}$/) // al menos una mayúscula y un numero
      ]],
      confirmPassword: ['', Validators.required],
      biografia: ['', Validators.required],
      telefono: ['', [
        Validators.required,
        Validators.pattern(/^\d{9}$/)  // Asume un teléfono español sin prefijo
      ]],
      idProvincia: ['', Validators.required],
      idInstrumento: ['', Validators.required],
      rol: ['', Validators.required],
      nivelMusical: [''],
      coche: ['0'],
      fundacion: ['']
    }, {
      validators: [this.passwordsMatchValidator]
    });

    this.registerForm.get('rol')?.valueChanges.subscribe((rol) => {
      const idInstrumento = this.registerForm.get('idInstrumento');
      const nivelMusical = this.registerForm.get('nivelMusical');
      const coche = this.registerForm.get('coche');
      const fundacion = this.registerForm.get('fundacion');

      if (rol === 'musico') {
        idInstrumento?.setValidators([Validators.required]);
        nivelMusical?.setValidators([Validators.required]);
        coche?.setValidators([Validators.requiredTrue]); // checkbox como requerido
        fundacion?.clearValidators();
      } else if (rol === 'charanga') {
        fundacion?.setValidators([Validators.required]);
        idInstrumento?.clearValidators();
        nivelMusical?.clearValidators();
        coche?.clearValidators();
      } else {
        idInstrumento?.clearValidators();
        nivelMusical?.clearValidators();
        coche?.clearValidators();
        fundacion?.clearValidators();
      }

      // Actualizamos validaciones
      idInstrumento?.updateValueAndValidity();
      nivelMusical?.updateValueAndValidity();
      coche?.updateValueAndValidity();
      fundacion?.updateValueAndValidity();
    });

    this.cargarProvincias();
    this.cargarInstrumentos();
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
  
    // Añadir todos los campos de texto
    const formData = new FormData();
    Object.entries(this.registerForm.value).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
  
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

  passwordsMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
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

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

}
