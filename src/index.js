class MiiChart{

  constructor( params ){

    this.canvasId = params.canvasId;

    this.AVG = params.AVG || false;
    this.W = 0;
    this.H = 0;
    this.G_shift = 5;
    this.OFF_INCR_STEP = params.stepX || 5;
    this.GRIND_SIZE = 10;
    // this.x_steps_cutoff = $('#charts-wrapper').width() - 50;
    this.x_steps_cutoff = 0;
    this.bgColor = params.bgColor || '#000';
    this.fgColor = params.fgColor || '#0F0';
    this.showGrid = params.showGrid || true;
    this.gridSizeX = params.gridSizeX || 50;
    this.gridSizeY = params.gridSizeY || 10;
    this.gridColor = params.gridColor || 'rgba(127,127,127, 0.5)';

    // this.steps_x = Math.round( this.W / this.gridSizeX );
    // this.steps_y = Math.round( this.H / this.gridSizeY );
    this.steps_x = this.gridSizeX;
    this.steps_y = this.gridSizeY;

    this.DPI = window.devicePixelRatio;
    this.canvas = document.getElementById( this.canvasId );
    this.canvas.setAttribute('width', '100%');
    this.canvas.setAttribute('height', '100%');
    // this.canvas.setAttribute('width', (this.W * this.DPI)+'px');
    // this.canvas.setAttribute('height', (this.H * this.DPI)+'px');
    this.canvas.style.display = 'inline-block';
    this.ctx = this.canvas.getContext("2d");

    this.data = [];
    this.clrIndex = 0;
    this.clrs = ['#FF7700','#2ACDe2','#29e999','#708090','#FF00FF','#1E90FF','#e33333','#00EE76','#EEEE00','#FFC125','#666666','#00EEEE','#00FF00','#dddddd','#FF0000','#BF3EFF',];

    this.keysOrder = false;
    this._isInited = false;
    this._init();

  }

  _init(){

    const self = this;

    if( self._isInited ) return true;

    // if( typeof self.W === 'string' ){
    //   if( self.W.indexOf('%') !== -1 ){
    //     self.W = +(self.W.replace('%','').trim());
    //   }else{
    //     self.W = (+self.W);
    //   }
    // }

    self.onResize();

    window.addEventListener('resize', async(event)=>{
      self.onResize();
    });

  }

  onResize(){
    this.W = this.canvas.offsetWidth;
    this.H = this.canvas.offsetHeight;
    // console.log('onResize', this.W, this.H);
    this.canvas.setAttribute('width', (this.W * this.DPI)+'px');
    this.canvas.setAttribute('height', (this.H * this.DPI)+'px');
    // this.canvas.style.display = 'inline-block';
    // this.ctx = this.canvas.getContext("2d");
    this.x_steps_cutoff = ( (this.W- 50) / this.OFF_INCR_STEP); // 50px before end
  }

  clear( ){
    // this.ctx.clearRect(0, 0, this.W, this.H);
    this.drawRect( 0, 0, this.W, this.H, this.gridColor, this.bgColor );
    this.drawGrid();
  }

  drawGrid(){
    for (let x=this.steps_x; x<(this.W+this.steps_x); x+=this.steps_x)
      this.drawLine( x-this.G_shift, 0, x-this.G_shift, this.H, this.gridColor );
    for (let y=this.steps_y; y<this.H; y+=this.steps_y )
      this.drawLine( 0, y, this.W, y, this.gridColor );

    this.drawRect( 0, 0, this.W, this.H, this.gridColor );
  }

  drawRect( x0, y0, w, h, fgColor, bgColor ){
    this.ctx.beginPath();
    this.ctx.strokeStyle = fgColor || this.fgColor;
    this.ctx.fillStyle = bgColor || 'rgb(0,0,0,0)';
    this.ctx.rect( x0, y0, w, h);
    this.ctx.fill();
    this.ctx.stroke();
  }

  drawDot ( x0, y0, D, clr ){
    this.ctx.beginPath();
    this.ctx.fillStyle = clr ? clr : 'rgba(0, 128, 255, 1)';
    this.ctx.arc( x0, y0, D, 0, 2*Math.PI);
    this.ctx.fill();
  }

  drawLine ( x0, y0, x1, y1, clr ){
    this.ctx.beginPath();
    this.ctx.strokeStyle = clr ? clr : 'rgba(0, 128, 255, 1)';
    this.ctx.lineWidth = 1;
    // this.ctx.fillStyle = "rgb(0,255,0)" ;
    this.ctx.moveTo( x0, y0 );
    this.ctx.lineTo( x1, y1 );
    this.ctx.stroke();
  }

  text ( x0, y0, text, clr, size ){
    this.ctx.font = ( size ? size : 12 )+'px monospace';
    this.ctx.fillStyle = clr || '#eee';
    this.ctx.fillText( text, x0, y0 );                
  }

  pushData( data ){
    this.data.push( data );
  }

  draw(){

    this.clear();

    if( this.data.length < 2 )
      return;

    if( this.data.length > this.x_steps_cutoff ){
      if( this.G_shift < this.steps_x-this.OFF_INCR_STEP ) this.G_shift += this.OFF_INCR_STEP;
      else this.G_shift = 0;
      this.data.shift(0);
    }

    let OFF_X = 2;
    let OFF_Y = this.H; // + this.H /2;

    let MAX_VAL = 0;
    let ASP = 0;

    if( !this.keysOrder || this.keysOrder.length < Object.keys( this.data[ this.data.length-1 ] ).length ){
      this.keysOrder = Object.keys( this.data[ this.data.length-1 ] );

    }

    // console.table( this.keysOrder );

    for( let i=0; i < this.data.length-1; i++ ){
      let data = this.data[ i ];
      for( let key of this.keysOrder ){

        let clr = this.clrs[ this.clrIndex ];
        let val = (+data[ key ]);

        if( typeof data[ key ] === 'object' ){
          clr = data[ key ].color || data[ key ].c || clr;
          val = +(+data[ key ].value || +data[ key ].v || val);
        }

        MAX_VAL = (val) > MAX_VAL ? (val) : MAX_VAL; 
      }
    }

    ASP = this.H / MAX_VAL;

    let AVG = {}
    for( let _key of this.keysOrder ) AVG[ _key ] = 0;
      
    for( let i=1; i< this.data.length; i++ ){

      let data_prev = this.data[ i-1 ];
      let data_curr = this.data[ i+0 ];
      this.clrIndex = 0;

      // let clr = this.clrs[ this.clrIndex ];
      // let c_val = (+data_curr[ key ]);

      // if( typeof data[ key ] === 'object' ){
      //   clr = data[ key ].color || data[ key ].c || clr;
      //   val = (+data[ key ].value || data[ key ].v || val);
      // }


      for( let key of this.keysOrder ){

        // get next color 
        if( (++this.clrIndex) >= this.clrs.length-1 ) this.clrIndex = 0;

        let clr = this.clrs[ this.clrIndex ];

        let val_prev = (+data_prev[ key ]);
        let val_curr = (+data_curr[ key ]);

        if( typeof data_prev[ key ] === 'object' ){
          clr = data_prev[ key ].color || data_prev[ key ].c || clr;
          val_prev = +(+data_prev[ key ].value || +data_prev[ key ].v || val);
        }

        if( typeof data_curr[ key ] === 'object' ){
          clr = data_curr[ key ].color || data_curr[ key ].c || clr;
          val_prev = +(+data_curr[ key ].value || +data_curr[ key ].v || val);
        }

        if( this.AVG ){
          AVG[ key ] += val_curr;
          // AVG
          this.drawDot( OFF_X, OFF_Y - (( AVG[ key ] / (i+1) ) * ASP - 20 ), 1, clr );
            
        }else{
          // NON AVG
          this.drawDot( OFF_X, OFF_Y - ((val_prev) * ASP - 20 ), 1, clr );
          this.drawLine( OFF_X, OFF_Y - ((val_curr) * ASP - 20 ), OFF_X+5, OFF_Y - ((val_prev) * ASP - 20 ), clr);
        }

      }

      OFF_X += this.OFF_INCR_STEP;

    }

    let text_offset = 20;
    let last_data = this.data[ this.data.length-1 ];

    this.clrIndex = 0;
    for( let key of this.keysOrder ){
      if( (++this.clrIndex) >= this.clrs.length-1 ) this.clrIndex = 0;

      let clr = this.clrs[ this.clrIndex ];
      let val = (+last_data[ key ]);

      if( typeof last_data[ key ] === 'object' ){
        clr = last_data[ key ].color || last_data[ key ].c || clr;
        val = +(+last_data[ key ].value || +last_data[ key ].v || val);
      }

      this.text( 10, text_offset, key+' : '+( val.toFixed( 5 ) ), clr, 14);
      text_offset += 16;
    }

  }

  toFixed( inp, upto=2 ){ return +((+inp).toFixed( upto )); }
  rad2ang( rad ){ return rad * 180 / Math.PI; }
  ang2rad( ang ){ return ang * Math.PI / 180; }
  randInt( min, max ){ return Math.floor( Math.random() * (max - min + 1)) + min; }
  randFloat( min, max ){ return (Math.random() * (max - min + 0.001)) + min; }
  randX(){ return this.randInt( 0, this.W ); }
  randY(){ return this.randInt( 0, this.H ); }


}

// let NodeMem = new MCharts( { AVG: false, canvas_id: 'node-mem-canvas', W: MAX_W, H: 450 } );
// NodeMem.pushData( data.node_info );
// NodeMem.draw();

/*

  const MainChart = new MiiChart({
    canvasId: 'main-chart',
    W: 1200,
    H: 300,

    bgColor: '#000',
    fgColor: '#0F0',
    showGrid: true,
    gridSizeX: 50,
    gridSizeY: 10,
    gridColor: 'rgba(127,127,127, 0.5)',
    stepX: 10,

  });

  (()=>{

    let A = 0;
    let B = 0;
    let C = 0;
    let D = 0;
    let E = 0;
    let F = 0;
    let G = 0;

    function RND( V, from=0, upto=10 ){
      let mV = MainCan.randFloat( from, upto ) - ( upto /2 );
      V = (V +mV) < 0 ? V : (V +mV);
      return V;
    }

    function _push(){

      A = RND( A, 0, 4 );
      B = RND( B, 0, 4 );
      C = RND( C, 0, 4 );
      D = RND( D, 0, 4 );
      E = RND( E, 0, 4 );
      F = RND( F, 0, 4 );
      G = RND( G, 0, 4 );

      MainChart.pushData({ A, B, C, D, E, F, G });

      MainChart.draw();
      setTimeout(()=>{ _push(); },50);
    }

    _push();

  })();

*/

if( typeof module !== "undefined" ){
  module.exports = MiiChart;
}

