import {Component, OnInit, TemplateRef, ViewContainerRef} from '@angular/core';
import {AssetsPoolService} from "../../services/assets-pool.service";
import {Router} from "@angular/router";
import {ToastService} from "../../services/toast.service";
import {UserService} from "../../services/user.service";
import 'rxjs/add/operator/concatMap';
import { Observable } from 'rxjs/Observable';
import { forkJoin } from "rxjs/observable/forkJoin";
import 'rxjs/add/operator/concatMap';



import {Iuser} from "../../interface/user.interface";
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
@Component({
  selector: 'app-asset-pool-list',
  templateUrl: './asset-pool-list.component.html',
  styleUrls: ['./asset-pool-list.component.css']
})
export class AssetPoolListComponent implements OnInit {
    modalRef: BsModalRef;
    user={} as Iuser;
   pools=[];
    assetPoolHttpSstatus='resolved';
    blockchainHttpStatus='resolved';

    issueTokenHttpStatus='resolved';
  token={amount:null,exchangeRate:null};
  selectedPool={maximum:null,precision:null,blockchain:{currency:null},id:null};
  constructor(private assetPoolService:AssetsPoolService,
              private modalService: BsModalService,
              private router:Router,
              private toastService:ToastService,
              private userService:UserService) {

  }




  ngOnInit() {

      this.userService.user.subscribe((user:Iuser)=>{
          this.user=user;
          if(user.role==='sponsor'){
              this.getPools(user.issuerName);
          }
          else{
              this.getPools();
          }

      },(err)=>{
          console.log(err);
      })

  }

    openModal(template: TemplateRef<any>,selectedPool) {
      this.selectedPool=selectedPool;
      console.log(this.selectedPool)
        this.modalRef = this.modalService.show(template);

    }

    issueToken(){
        if(!this.token.amount){
            this.toastService.error('Issue','Invalid amount');
            return;
        }

        if(!this.token.exchangeRate){
            this.toastService.error('Issue','Invalid exchangeRate');
            return;

        }
        this.issueTokenHttpStatus='pending';
        this.assetPoolService.issueToken(this.user.id,this.selectedPool.id,this.token.amount,this.token.exchangeRate,this.selectedPool.precision,this.selectedPool.blockchain.currency)
            .subscribe((data:any)=>{
            console.log(data)
            this.issueTokenHttpStatus='resolved';
            this.token.amount=null;
            this.token.exchangeRate=null;
            this.toastService.success('Issue','Issued successfully');
            this.router.navigate(['/dashboard/tokens'])
            this.modalRef.hide();

        },(err)=>{
            this.issueTokenHttpStatus='rejected';
            this.toastService.error('Issue',err.message);
            console.log(err);
        });
    }


  getPools(issuerName:string=null){
        this.assetPoolHttpSstatus='pending';

    this.assetPoolService.getPools(issuerName).subscribe((pools:any[])=>{
        this.pools=pools;

        this.assetPoolHttpSstatus='resolved';

        this.getPoolInfoFromBlockchain(pools);
    },(err)=>{
      console.log(err);
        this.assetPoolHttpSstatus='rejected';

    })
  }



  getPoolInfoFromBlockchain(pools:any[]){

      console.log(pools)
      const arr=[];
      pools.forEach((pool)=>{
        const name=pool.issuerName+'.'+pool.currency;
        arr.push(this.assetPoolService.getAssetPoolInfoFromBlockchain(name));
      });

      console.log(arr)

      console.log(arr.length)

      this.blockchainHttpStatus='pending';
      forkJoin(arr).subscribe(results => {

          console.log('result is')
          console.log(results)
        const length=pools.length;
        for(let i=0;i<length;i++){
            if(results[i].constructor === Object && Object.keys(results[i]).length > 0 )
            this.pools[i].blockchain=results[i];
        }

          this.blockchainHttpStatus='resolved';


      },(err)=>{
          this.blockchainHttpStatus='rejected';

      });
  }

    getColor(status:string){
        status=String(status);
        switch (status){
            case '1':
                return 'green';
            case '0':
                return '#ff8b4c';
            default:
                return 'black';
        }
    }
}
