import { Component, OnInit } from '@angular/core';
import { CarrinhoService } from '../services/carrinho.service';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { ComprasService } from '../services/compras.service';
import { envio } from '../services/metodosEnvio';

@Component({
  selector: 'app-compra',
  templateUrl: './compra.page.html',
  styleUrls: ['./compra.page.scss'],
})
export class CompraPage implements OnInit {
  carrinho: any[] = [];
  compras: any;
  morada: any;
  envio: any;
  metodoEnvio: any[] = envio
  pagamento: any;
  feedback?: any
  multibancoInputVisible: boolean = false;
  mbwayInputVisible: boolean = false;
  mbwayValue: string = '';
  extras: number = 0;
  total: number = 0;
  moradaErro: string = '';
  envioErro: string = '';
  pagamentoErro: string = '';
  mbwayErro: string = '';

  constructor(
    private carrinhoS: CarrinhoService,
    private alertController: AlertController,
    private router: Router,
    private supabase: SupabaseService,
    private comprasS: ComprasService
  ) {}

  async ngOnInit() {
    await this.carrinhoS.init();
  }

  async ionViewDidEnter() {
    await this.carrinhoS.getCarrinho().then((car) => {
      this.carrinho = car;
      this.getExtras();
      this.getTotal();
    });
  }

  irDetalhes(id: number) {
    this.router.navigate(['/produto', id]);
  }

  async eliminarFavorito(id: number) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminação',
      message: 'Tem certeza que deseja eliminar este produto do carrinho?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Cancelar');
          },
        },
        {
          text: 'Eliminar',
          handler: async  () => {
            this.carrinhoS.eliminarCarrinho(id);
            if(this.carrinho.length === 0){
              this.router.navigateByUrl('/tabs/loja');
            }
            this.carrinho = await this.carrinhoS.getCarrinho();
            this.getExtras()
            this.getTotal()
          },
        },
      ],
    });
    await alert.present();
  }

  async comprar() {
    const alerta = await this.alertController.create({
      header: 'Confirmar compra',
      message: 'Tem certeza que deseja confirma a compra?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Cancelar');
          },
        },
        {
          text: 'Comprar',
          handler: () => {
            this.moradaErro = '';
            this.envioErro = '';
            this.pagamentoErro = '';
            this.mbwayErro = '';
            if (this.verificarCampos()) {
              this.compras = {
                id: Date.now(),
                morada: this.morada,
                envio: this.envio,
                pagamento: this.pagamento,
                produto: this.carrinho,
                numeroMBWAY: this.mbwayValue,
                preco: this.total,
                feedback: this.feedback
              };
              console.log('compra: ', this.compras);
              this.comprasS.inserirCompras(this.compras);
              this.carrinhoS.limparCarrinho()
              this.supabase.mostrarMensagem('Compra realizada com sucesso!')
              this.router.navigateByUrl('/tabs/loja');
            } else {
              this.supabase.mostrarErro('Por favor, preencha todos os campos obrigatórios!', 'Verifique todos os campos');
              console.log('Preencha todos os campos obrigatórios!');
              this.mostrarErros();
            }
          },
        },
      ],
    });
    await alerta.present();
  }

  verificarCampos(): boolean {
    let isValid = true;

    if (!this.morada || this.morada.trim() === '') {
      this.moradaErro = 'Por favor, introduza a sua morada.';
      isValid = false;
    }
    if (!this.envio) {
      this.envioErro = 'Por favor, selecione um método de envio.';
      isValid = false;
    }
    if (!this.pagamento) {
      this.pagamentoErro = 'Por favor, selecione um método de pagamento.';
      isValid = false;
    }
    if (
      this.mbwayInputVisible &&
      (!this.mbwayValue || this.mbwayValue.trim() === '')
    ) {
      this.mbwayErro = 'Por favor, introduza o seu número de telefone.';
      isValid = false;
    }
    return isValid;
  }

  mostrarErros() {
    this.moradaErro = this.moradaErro ? this.moradaErro : '';
    this.envioErro = this.envioErro ? this.envioErro : '';
    this.pagamentoErro = this.pagamentoErro ? this.pagamentoErro : '';
    this.mbwayErro = this.mbwayErro ? this.mbwayErro : '';
  }

  getTotal() {
    this.carrinhoS.getTotal().then((total) => {
      this.total = total + this.extras;
    });
  }

  getExtras(){
    this.carrinhoS.getExtras().then(extras => {
      this.extras = extras;
    });
  }
}
