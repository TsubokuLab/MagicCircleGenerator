  // インポートボタン
  document.getElementById('import-button').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  
  // ファイル選択時の処理
  document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
      const success = importLayersFromJSON(event.target.result);
      if (success) {
        //alert('レイヤーデータのインポートが完了しました。');
      } else {
        alert('レイヤーデータのインポート中にエラーが発生しました。');
      }
      // ファイル入力をリセット
      e.target.value = '';
    };
    reader.readAsText(file);
  });// レイヤーデータのインポート
function importLayersFromJSON(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    
    // 設定をインポート
    if (data.settings) {
      app.settings = { ...data.settings };
      
      // UIのカラーピッカーとチェックボックスを更新
      document.getElementById('background-color').value = app.settings.backgroundColor;
      document.getElementById('foreground-color').value = app.settings.foregroundColor;
      document.getElementById('transparent-background').checked = app.settings.transparentBackground;
    }
    
    // レイヤーをインポート
    if (data.layers && Array.isArray(data.layers)) {
      // 既存のレイヤーをクリア
      app.layers = [];
      app.nextLayerId = 0;
      
      // 新しいレイヤーを追加
      data.layers.forEach(layerData => {
        LayerManager.addLayer(layerData.type, layerData.params);
      });
      
      // レイヤーリストを更新
      LayerManager.updateLayersList();
    }
    
    // キャンバスを再描画
    renderCanvas();
    
    return true;
  } catch (error) {
    console.error('JSONファイルのインポートエラー:', error);
    return false;
  }
}/**
 * 魔法陣ジェネレーター
 * ブラウザで動作する魔法陣作成ツール
 */

// 基準キャンバスサイズ
const BASE_CANVAS_SIZE = 1024;

// グローバル変数
const app = {
  canvas: null,
  ctx: null,
  layers: [],
  activeLayer: null,
  nextLayerId: 0,
  settings: {
    backgroundColor: '#000000',
    foregroundColor: '#ffffff',
    transparentBackground: false
  }
};

// レイヤーデータのインポート
function importLayersFromJSON(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    
    // 設定をインポート
    if (data.settings) {
      // 基本設定を上書き
      app.settings = { ...data.settings };
      
      // UIの設定を更新
      document.getElementById('background-color').value = app.settings.backgroundColor;
      document.getElementById('foreground-color').value = app.settings.foregroundColor;
      document.getElementById('transparent-background').checked = app.settings.transparentBackground;
    }
    
    // レイヤーをインポート
    if (data.layers && Array.isArray(data.layers)) {
      // 既存のレイヤーをクリア
      app.layers = [];
      app.nextLayerId = 0;
      
      // 新しいレイヤーを追加
      data.layers.forEach(layerData => {
        LayerManager.addLayer(layerData.type, layerData.params);
      });
      
      // レイヤーリストを更新
      LayerManager.updateLayersList();
    }
    
    // キャンバスを再描画
    renderCanvas();
    
    return true;
  } catch (error) {
    console.error('JSONファイルのインポートエラー:', error);
    return false;
  }
}

// ユーティリティ関数
const Utils = {
  /**
   * 度数法からラジアンに変換
   */
  degToRad: function(degrees) {
    return degrees * Math.PI / 180;
  },
  
  /**
   * 極座標から直交座標に変換（中心が原点）
   */
  polarToCartesian: function(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = this.degToRad(angleInDegrees);
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  }
};

// レイヤークラス
class Layer {
  constructor(id, type, params) {
    this.id = id;
    this.type = type;
    this.params = params;
    this.visible = true;
    this.isGhost = false; // ゴーストガイド表示用フラグ
  }
  
  render(ctx, customCanvas) {
    if (!this.visible) return;
    
    // カスタムキャンバスが指定されていない場合はデフォルトのキャンバスを使用
    const canvas = customCanvas || app.canvas;
    
    switch(this.type) {
      case 'circle':
        this.renderCircle(ctx, canvas);
        break;
      case 'shapes':
        this.renderShapes(ctx, canvas);
        break;
      case 'lines':
        this.renderLines(ctx, canvas);
        break;
    }
  }
  
  renderCircle(ctx, canvas) {
    const { radius, thickness, style, color } = this.params;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(canvas.width, canvas.height) / 2;
    const actualRadius = radius * maxRadius;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    
    if (style === 'dashed') {
      ctx.setLineDash([10, 5]);
    } else if (style === 'dotted') {
      ctx.setLineDash([2, 5]);
    } else {
      ctx.setLineDash([]);
    }
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, actualRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  
  renderShapes(ctx, canvas) {
    const {
      shapeType, size, count, radius, offset, fill, color, rotation = 0, aspect = 1
    } = this.params;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(canvas.width, canvas.height) / 2;
    const actualRadius = radius * maxRadius;
    const actualSize = size * maxRadius;
    
    for (let i = 0; i < count; i++) {
      const angle = (i * 360 / count) + offset;
      const pos = Utils.polarToCartesian(centerX, centerY, actualRadius, angle);
      
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      
      switch(shapeType) {
        case 'circle':
          this.drawCircleShape(ctx, pos.x, pos.y, actualSize, fill);
          break;
        case 'arc':
          this.drawArcShape(ctx, centerX, centerY, actualRadius, angle, actualSize, fill);
          break;
        case 'square':
          this.drawSquareShape(ctx, pos.x, pos.y, actualSize, angle, fill);
          break;
        case 'triangle':
          this.drawTriangleShape(ctx, pos.x, pos.y, actualSize, angle, fill);
          break;
        case 'diamond':
          this.drawDiamondShape(ctx, pos.x, pos.y, actualSize, angle, fill);
          break;
        case 'star':
          this.drawStarShape(ctx, pos.x, pos.y, actualSize, angle, fill);
          break;
      }
    }
  }
  
  drawCircleShape(ctx, x, y, size, fill) {
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    
    if (fill === 'fill' || fill === 'both') {
      ctx.fill();
    }
    
    if (fill === 'stroke' || fill === 'both') {
      ctx.stroke();
    }
  }
  
  drawArcShape(ctx, centerX, centerY, radius, angle, size, fill) {
    const arcSize = Utils.degToRad(size);
    const startAngle = Utils.degToRad(angle - size / 2);
    const endAngle = Utils.degToRad(angle + size / 2);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    
    if (fill === 'fill' || fill === 'both') {
      // 弧を塗りつぶす場合、中心に線を引く必要がある
      const start = Utils.polarToCartesian(centerX, centerY, radius, angle - size / 2);
      const end = Utils.polarToCartesian(centerX, centerY, radius, angle + size / 2);
      ctx.lineTo(centerX, centerY);
      ctx.closePath();
      ctx.fill();
    }
    
    if (fill === 'stroke' || fill === 'both') {
      ctx.stroke();
    }
  }
  
  drawSquareShape(ctx, x, y, size, angle, fill) {
    const { aspect = 1, rotation = 0 } = this.params;
    const halfWidth = size / 2;
    const halfHeight = size / (2 * aspect);
    
    ctx.save();
    ctx.translate(x, y);
    // 角度オフセットに加えて図形自体の回転を適用
    ctx.rotate(Utils.degToRad(angle + rotation));
    
    ctx.beginPath();
    ctx.rect(-halfWidth, -halfHeight, halfWidth * 2, halfHeight * 2);
    
    if (fill === 'fill' || fill === 'both') {
      ctx.fill();
    }
    
    if (fill === 'stroke' || fill === 'both') {
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  drawTriangleShape(ctx, x, y, size, angle, fill) {
    const { aspect = 1, rotation = 0 } = this.params;
    
    ctx.save();
    ctx.translate(x, y);
    // 角度オフセットに加えて図形自体の回転を適用
    // 初期値は上向きにするため、-90度回転させる
    ctx.rotate(Utils.degToRad(angle + rotation - 90));
    
    const width = size;
    const height = size * aspect;
    
    ctx.beginPath();
    // 上向きの三角形（▲）
    ctx.moveTo(0, -height / 2);
    ctx.lineTo(-width / 2, height / 2);
    ctx.lineTo(width / 2, height / 2);
    ctx.closePath();
    
    if (fill === 'fill' || fill === 'both') {
      ctx.fill();
    }
    
    if (fill === 'stroke' || fill === 'both') {
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  drawDiamondShape(ctx, x, y, size, angle, fill) {
    const { aspect = 1, rotation = 0 } = this.params;
    
    ctx.save();
    ctx.translate(x, y);
    // 角度オフセットに加えて図形自体の回転を適用
    ctx.rotate(Utils.degToRad(angle + rotation));
    
    const halfWidth = size / 2;
    const halfHeight = size / (2 * aspect);
    
    ctx.beginPath();
    ctx.moveTo(0, -halfHeight);
    ctx.lineTo(halfWidth, 0);
    ctx.lineTo(0, halfHeight);
    ctx.lineTo(-halfWidth, 0);
    ctx.closePath();
    
    if (fill === 'fill' || fill === 'both') {
      ctx.fill();
    }
    
    if (fill === 'stroke' || fill === 'both') {
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  drawStarShape(ctx, x, y, size, angle, fill) {
    const { aspect = 1, rotation = 0 } = this.params;
    const spikes = 5;
    const outerRadius = size / 2;
    const innerRadius = outerRadius / 2;
    
    ctx.save();
    ctx.translate(x, y);
    // 上向きの星形になるように角度を調整し、さらに回転を適用
    ctx.rotate(Utils.degToRad(angle + rotation - 90));
    // アスペクト比を適用
    ctx.scale(1, 1/aspect);
    
    ctx.beginPath();
    
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const pointAngle = (i * Math.PI) / spikes;
      
      if (i === 0) {
        ctx.moveTo(radius, 0);
      } else {
        const px = radius * Math.cos(pointAngle);
        const py = radius * Math.sin(pointAngle);
        ctx.lineTo(px, py);
      }
    }
    
    ctx.closePath();
    
    if (fill === 'fill' || fill === 'both') {
      ctx.fill();
    }
    
    if (fill === 'stroke' || fill === 'both') {
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  renderLines(ctx, canvas) {
    const { 
      lineType, count, radius, thickness, offset, color, starFactor 
    } = this.params;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(canvas.width, canvas.height) / 2;
    const actualRadius = radius * maxRadius;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    
    switch(lineType) {
      case 'radial':
        this.drawRadialLines(ctx, centerX, centerY, actualRadius, count, offset);
        break;
      case 'connecting':
        this.drawConnectingLines(ctx, centerX, centerY, actualRadius, count, offset);
        break;
      case 'polygon':
        this.drawPolygon(ctx, centerX, centerY, actualRadius, count, offset);
        break;
      case 'star':
        this.drawStar(ctx, centerX, centerY, actualRadius, count, offset, starFactor);
        break;
    }
  }
  
  drawRadialLines(ctx, centerX, centerY, radius, count, offset) {
    for (let i = 0; i < count; i++) {
      const angle = (i * 360 / count) + offset;
      const end = Utils.polarToCartesian(centerX, centerY, radius, angle);
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  }
  
  drawConnectingLines(ctx, centerX, centerY, radius, count, offset) {
    // 全ての点を計算
    const points = [];
    
    for (let i = 0; i < count; i++) {
      const angle = (i * 360 / count) + offset;
      points.push(Utils.polarToCartesian(centerX, centerY, radius, angle));
    }
    
    // すべての点を相互に接続
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[j].x, points[j].y);
        ctx.stroke();
      }
    }
  }
  
  drawPolygon(ctx, centerX, centerY, radius, count, offset) {
    ctx.beginPath();
    
    for (let i = 0; i < count; i++) {
      const angle = (i * 360 / count) + offset;
      const point = Utils.polarToCartesian(centerX, centerY, radius, angle);
      
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }
    
    ctx.closePath();
    ctx.stroke();
  }
  
  drawStar(ctx, centerX, centerY, radius, count, offset, factor) {
    if (count < 3) count = 3;
    if (!factor) factor = 2;
    
    ctx.beginPath();
    
    for (let i = 0; i < count; i++) {
      const angle = (i * 360 / count) + offset;
      const point = Utils.polarToCartesian(centerX, centerY, radius, angle);
      
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        // 星形の次の点はfactor個先
        const nextIndex = (i * factor) % count;
        const nextAngle = (nextIndex * 360 / count) + offset;
        const nextPoint = Utils.polarToCartesian(centerX, centerY, radius, nextAngle);
        
        ctx.lineTo(nextPoint.x, nextPoint.y);
      }
    }
    
    ctx.closePath();
    ctx.stroke();
  }
}

// レイヤー管理
const LayerManager = {
  addLayer: function(type, params) {
    const layer = new Layer(app.nextLayerId++, type, params);
    app.layers.push(layer);
    app.activeLayer = layer;
    this.updateLayersList();
    renderCanvas();
    return layer;
  },
  
  removeLayer: function(id) {
    const index = app.layers.findIndex(layer => layer.id === id);
    if (index !== -1) {
      app.layers.splice(index, 1);
      if (app.activeLayer && app.activeLayer.id === id) {
        app.activeLayer = app.layers.length > 0 ? app.layers[app.layers.length - 1] : null;
      }
      this.updateLayersList();
      renderCanvas();
    }
  },
  
  toggleLayerVisibility: function(id) {
    const layer = app.layers.find(layer => layer.id === id);
    if (layer) {
      layer.visible = !layer.visible;
      this.updateLayersList();
      renderCanvas();
    }
  },
  
  moveLayerUp: function(id) {
    const index = app.layers.findIndex(layer => layer.id === id);
    if (index < app.layers.length - 1) {
      [app.layers[index], app.layers[index + 1]] = [app.layers[index + 1], app.layers[index]];
      this.updateLayersList();
      renderCanvas();
    }
  },
  
  moveLayerDown: function(id) {
    const index = app.layers.findIndex(layer => layer.id === id);
    if (index > 0) {
      [app.layers[index], app.layers[index - 1]] = [app.layers[index - 1], app.layers[index]];
      this.updateLayersList();
      renderCanvas();
    }
  },
  
  updateLayersList: function() {
    const layersList = document.getElementById('layers-list');
    layersList.innerHTML = '';
    
    // レイヤーを逆順に表示（上に表示されるものが先）
    for (let i = app.layers.length - 1; i >= 0; i--) {
      const layer = app.layers[i];
      const layerItem = document.createElement('div');
      layerItem.className = 'layer-item';
      
      if (app.activeLayer && app.activeLayer.id === layer.id) {
        layerItem.classList.add('active');
      }
      
      layerItem.innerHTML = `
        <span class="layer-visibility" data-id="${layer.id}">
          ${layer.visible ? '👁️' : '👁️‍🗨️'}
        </span>
        <span class="layer-name">${this.getLayerName(layer)}</span>
        <div class="layer-actions">
          <button class="layer-up" data-id="${layer.id}">↑</button>
          <button class="layer-down" data-id="${layer.id}">↓</button>
          <button class="layer-delete" data-id="${layer.id}">×</button>
        </div>
      `;
      
      layersList.appendChild(layerItem);
    }
    
    // イベントリスナー追加
    document.querySelectorAll('.layer-visibility').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        this.toggleLayerVisibility(id);
      });
    });
    
    document.querySelectorAll('.layer-up').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        this.moveLayerUp(id);
      });
    });
    
    document.querySelectorAll('.layer-down').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        this.moveLayerDown(id);
      });
    });
    
    document.querySelectorAll('.layer-delete').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        this.removeLayer(id);
      });
    });
    
    document.querySelectorAll('.layer-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (!e.target.matches('button, .layer-visibility')) {
          const id = parseInt(el.querySelector('.layer-visibility').dataset.id);
          const layer = app.layers.find(l => l.id === id);
          if (layer) {
            app.activeLayer = layer;
            this.updateLayersList();
          }
        }
      });
    });
  },
  
  getLayerName: function(layer) {
    switch(layer.type) {
      case 'circle':
        return `円 (r=${layer.params.radius})`;
      case 'shapes':
        return `${this.getShapeTypeName(layer.params.shapeType)} x${layer.params.count}`;
      case 'lines':
        return `${this.getLineTypeName(layer.params.lineType)} (n=${layer.params.count})`;
      default:
        return `レイヤー ${layer.id}`;
    }
  },
  
  getShapeTypeName: function(type) {
    const types = {
      'circle': '丸',
      'arc': '弧',
      'square': '四角',
      'triangle': '三角',
      'diamond': 'ひし形',
      'star': '星'
    };
    return types[type] || type;
  },
  
  getLineTypeName: function(type) {
    const types = {
      'radial': '放射線',
      'connecting': '接続線',
      'polygon': '多角形',
      'star': '星形'
    };
    return types[type] || type;
  }
};

// キャンバス描画
function renderCanvas() {
  // キャンバスサイズをコンテナに合わせて設定
  const container = document.querySelector('.canvas-container');
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  
  // 正方形に保つため、小さい方のサイズを使用
  const size = Math.min(containerWidth, containerHeight) - 40; // 余白用に少し小さく
  
  app.canvas.width = size;
  app.canvas.height = size;
  
  // 背景クリア
  if (app.settings.transparentBackground) {
    // 透過背景の場合は完全にクリア
    app.ctx.clearRect(0, 0, app.canvas.width, app.canvas.height);
    
    // キャンバスの背景にチェック柄パターンを表示
    // キャンバスのコンテナにクラスを追加
    container.classList.add('transparent-bg');
  } else {
    // 背景色を設定
    app.ctx.fillStyle = app.settings.backgroundColor;
    app.ctx.fillRect(0, 0, app.canvas.width, app.canvas.height);
    
    // チェック柄クラスを削除
    container.classList.remove('transparent-bg');
  }
  
  // レイヤー描画
  app.layers.forEach(layer => {
    layer.render(app.ctx);
  });
}

// キャンバスのエクスポート
const Exporter = {
  exportImage: function(format) {
    switch(format) {
      case 'png':
      case 'svg':
      case 'normalmap':
        this.exportTexture(format);
        break;
      case 'json':
        this.exportLayersAsJSON();
        break;
    }
  },
  
  exportTexture: function(format) {
    // 選択されたテクスチャサイズを取得
    const textureSize = parseInt(document.getElementById('texture-size').value);
    
    // エクスポート用の一時キャンバスを作成
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = textureSize;
    exportCanvas.height = textureSize;
    const exportCtx = exportCanvas.getContext('2d');
    
    // スケール係数を計算（1024pxを基準とする）
    const scaleFactor = textureSize / BASE_CANVAS_SIZE;
    
    // 背景色を設定（透過設定がオフの場合のみ）
    if (!app.settings.transparentBackground) {
      exportCtx.fillStyle = app.settings.backgroundColor;
      exportCtx.fillRect(0, 0, textureSize, textureSize);
    }
    
    // 全てのレイヤーをエクスポートキャンバスに描画
    app.layers.filter(layer => !layer.isGhost).forEach(layer => {
      // レイヤーのコピーを作成
      const tempLayer = new Layer(layer.id, layer.type, { ...layer.params });
      
      // 線の太さをスケーリング
      if (tempLayer.params.thickness) {
        tempLayer.params.thickness = Math.max(1, Math.round(tempLayer.params.thickness * scaleFactor));
      }
      
      // ローカルなキャンバスサイズを設定
      const tempCanvas = { width: textureSize, height: textureSize };
      tempLayer.render(exportCtx, tempCanvas);
    });
    
    switch(format) {
      case 'png':
        this.exportAsPNG(exportCanvas);
        break;
      case 'svg':
        this.exportAsSVG(textureSize);
        break;
      case 'normalmap':
        this.exportAsNormalMap(exportCanvas);
        break;
    }
  },
  
  exportLayersAsJSON: function() {
    // レイヤーデータをシリアライズする
    const layersData = {
      settings: app.settings,
      layers: app.layers.filter(layer => !layer.isGhost).map(layer => {
        return {
          type: layer.type,
          params: { ...layer.params }
        };
      })
    };
    
    // JSONに変換
    const jsonString = JSON.stringify(layersData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    saveAs(blob, 'magic-circle-layers.json');
  },
  
  exportAsPNG: function(exportCanvas) {
    const dataURL = exportCanvas.toDataURL('image/png');
    const blob = this.dataURLToBlob(dataURL);
    saveAs(blob, 'magic-circle.png');
  },
  
// SVGエクスポート関数
exportAsSVG: function(size) {
// SVG作成
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
svg.setAttribute('width', size);
svg.setAttribute('height', size);
svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

// 背景（透過設定がオフの場合のみ）
if (!app.settings.transparentBackground) {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('width', size);
  rect.setAttribute('height', size);
  rect.setAttribute('fill', app.settings.backgroundColor);
  svg.appendChild(rect);
}

// スケール係数
const scaleFactor = size / BASE_CANVAS_SIZE;

// 全てのレイヤーをSVG要素に変換
app.layers.filter(layer => !layer.isGhost).forEach(layer => {
const layerSvg = this.createSVGFromLayer(layer, size, scaleFactor);
if (layerSvg) {
    svg.appendChild(layerSvg);
  }
});

// シリアライズ
const serializer = new XMLSerializer();
const svgString = serializer.serializeToString(svg);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    saveAs(svgBlob, 'magic-circle.svg');
  },

// レイヤーからSVG要素を作成
createSVGFromLayer: function(layer, size, scaleFactor) {
  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = size / 2;
  
  switch(layer.type) {
    case 'circle':
      return this.createCircleSVG(layer, centerX, centerY, maxRadius, scaleFactor);
    case 'shapes':
      return this.createShapesSVG(layer, centerX, centerY, maxRadius, scaleFactor);
    case 'lines':
      return this.createLinesSVG(layer, centerX, centerY, maxRadius, scaleFactor);
    default:
      return null;
  }
},

// 円レイヤーをSVGに変換
createCircleSVG: function(layer, centerX, centerY, maxRadius, scaleFactor) {
  const { radius, thickness, style, color } = layer.params;
  const actualRadius = radius * maxRadius;
  
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', centerX);
  circle.setAttribute('cy', centerY);
  circle.setAttribute('r', actualRadius);
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', color);
  circle.setAttribute('stroke-width', Math.max(1, thickness * scaleFactor));
  
  if (style === 'dashed') {
    circle.setAttribute('stroke-dasharray', '10,5');
  } else if (style === 'dotted') {
    circle.setAttribute('stroke-dasharray', '2,5');
  }
  
  return circle;
},

// 図形レイヤーをSVGに変換
createShapesSVG: function(layer, centerX, centerY, maxRadius, scaleFactor) {
  const { shapeType, size, count, radius, offset, fill, color, rotation = 0, aspect = 1 } = layer.params;
  const actualRadius = radius * maxRadius;
  const actualSize = size * maxRadius;
  
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('fill', fill === 'fill' || fill === 'both' ? color : 'none');
  group.setAttribute('stroke', fill === 'stroke' || fill === 'both' ? color : 'none');
  group.setAttribute('stroke-width', Math.max(1, scaleFactor));
  
  for (let i = 0; i < count; i++) {
    const angle = (i * 360 / count) + offset;
    const pos = Utils.polarToCartesian(centerX, centerY, actualRadius, angle);
    
    let shape;
    switch(shapeType) {
      case 'circle':
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        shape.setAttribute('cx', pos.x);
        shape.setAttribute('cy', pos.y);
        shape.setAttribute('r', actualSize / 2);
        break;
        
      case 'square':
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        shape.setAttribute('x', pos.x - (actualSize / 2));
        shape.setAttribute('y', pos.y - (actualSize / (2 * aspect)));
        shape.setAttribute('width', actualSize);
        shape.setAttribute('height', actualSize / aspect);
        shape.setAttribute('transform', `rotate(${angle + rotation}, ${pos.x}, ${pos.y})`);
        break;
        
      case 'triangle':
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const height = actualSize * aspect;
        const points = [
          [0, -height / 2],
          [-actualSize / 2, height / 2],
          [actualSize / 2, height / 2]
        ];
        
        // 三角形の回転を考慮
        const rotatedPoints = points.map(point => {
          const rads = Utils.degToRad(angle + rotation - 90);
          const rotX = point[0] * Math.cos(rads) - point[1] * Math.sin(rads);
          const rotY = point[0] * Math.sin(rads) + point[1] * Math.cos(rads);
          return [pos.x + rotX, pos.y + rotY];
        });
        
        shape.setAttribute('points', rotatedPoints.map(p => p.join(',')).join(' '));
        break;
        
      case 'diamond':
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const halfWidth = actualSize / 2;
        const halfHeight = actualSize / (2 * aspect);
        const diamondPoints = [
          [0, -halfHeight],
          [halfWidth, 0],
          [0, halfHeight],
          [-halfWidth, 0]
        ];
        
        // ひし形の回転を考慮
        const rotatedDiamondPoints = diamondPoints.map(point => {
          const rads = Utils.degToRad(angle + rotation);
          const rotX = point[0] * Math.cos(rads) - point[1] * Math.sin(rads);
          const rotY = point[0] * Math.sin(rads) + point[1] * Math.cos(rads);
          return [pos.x + rotX, pos.y + rotY];
        });
        
        shape.setAttribute('points', rotatedDiamondPoints.map(p => p.join(',')).join(' '));
        break;
        
      case 'star':
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const spikes = 5;
        const outerRadius = actualSize / 2;
        const innerRadius = outerRadius / 2;
        let starPoints = [];
        
        for (let i = 0; i < spikes * 2; i++) {
          const r = i % 2 === 0 ? outerRadius : innerRadius;
          const a = (i * Math.PI) / spikes;
          const sx = r * Math.cos(a);
          const sy = r * Math.sin(a);
          starPoints.push([sx, sy]);
        }
        
        // 星形の回転とアスペクト比を考慮
        const rotatedStarPoints = starPoints.map(point => {
          const rads = Utils.degToRad(angle + rotation - 90);
          const rotX = point[0] * Math.cos(rads) - point[1] * Math.sin(rads);
          const rotY = point[0] * Math.sin(rads) + point[1] * Math.cos(rads) / aspect;
          return [pos.x + rotX, pos.y + rotY];
        });
        
        shape.setAttribute('points', rotatedStarPoints.map(p => p.join(',')).join(' '));
        break;
        
      default:
        continue;
    }
    
    group.appendChild(shape);
  }
  
  return group;
},

// 線レイヤーをSVGに変換
createLinesSVG: function(layer, centerX, centerY, maxRadius, scaleFactor) {
  const { lineType, count, radius, thickness, offset, color, starFactor } = layer.params;
  const actualRadius = radius * maxRadius;
  
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('stroke', color);
  group.setAttribute('stroke-width', Math.max(1, thickness * scaleFactor));
  group.setAttribute('fill', 'none');
  
  switch(lineType) {
    case 'radial':
      for (let i = 0; i < count; i++) {
        const angle = (i * 360 / count) + offset;
        const end = Utils.polarToCartesian(centerX, centerY, actualRadius, angle);
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', centerX);
        line.setAttribute('y1', centerY);
        line.setAttribute('x2', end.x);
        line.setAttribute('y2', end.y);
        
        group.appendChild(line);
      }
      break;
      
    case 'connecting':
      // 全ての点を計算
      const points = [];
      for (let i = 0; i < count; i++) {
        const angle = (i * 360 / count) + offset;
        points.push(Utils.polarToCartesian(centerX, centerY, actualRadius, angle));
      }
      
      // すべての点を相互に接続
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', points[i].x);
          line.setAttribute('y1', points[i].y);
          line.setAttribute('x2', points[j].x);
          line.setAttribute('y2', points[j].y);
          
          group.appendChild(line);
        }
      }
      break;
      
    case 'polygon':
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      let polygonPoints = [];
      
      for (let i = 0; i < count; i++) {
        const angle = (i * 360 / count) + offset;
        const point = Utils.polarToCartesian(centerX, centerY, actualRadius, angle);
        polygonPoints.push(`${point.x},${point.y}`);
      }
      
      polygon.setAttribute('points', polygonPoints.join(' '));
      polygon.setAttribute('fill', 'none');
      group.appendChild(polygon);
      break;
      
    case 'star':
      if (count < 3) break;
      if (!starFactor) starFactor = 2;
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let pathData = '';
      
      for (let i = 0; i < count; i++) {
        const angle = (i * 360 / count) + offset;
        const point = Utils.polarToCartesian(centerX, centerY, actualRadius, angle);
        
        if (i === 0) {
          pathData += `M ${point.x} ${point.y} `;
        } else {
          // 星形の次の点はfactor個先
          const nextIndex = (i * starFactor) % count;
          const nextAngle = (nextIndex * 360 / count) + offset;
          const nextPoint = Utils.polarToCartesian(centerX, centerY, actualRadius, nextAngle);
          
          pathData += `L ${nextPoint.x} ${nextPoint.y} `;
        }
      }
      
      path.setAttribute('d', pathData + 'Z');
      group.appendChild(path);
      break;
  }
  
  return group;
},
  
  exportAsNormalMap: function(exportCanvas) {
    // オリジナル画像のデータ
    const exportCtx = exportCanvas.getContext('2d');
    const originalData = exportCtx.getImageData(0, 0, exportCanvas.width, exportCanvas.height);
    
    // ノーマルマップ用のキャンバスを作成
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = exportCanvas.width;
    normalCanvas.height = exportCanvas.height;
    const normalCtx = normalCanvas.getContext('2d');
    
    // ノーマルマップの強度
    const intensity = document.getElementById('normal-map-intensity').value / 10;
    
    // ノーマルマップを計算
    this.calculateNormalMap(originalData, normalCtx, intensity);
    
    // ノーマルマップをエクスポート
    const dataURL = normalCanvas.toDataURL('image/png');
    const blob = this.dataURLToBlob(dataURL);
    saveAs(blob, 'magic-circle-normalmap.png');
  },
  
  calculateNormalMap: function(originalData, normalCtx, intensity) {
    const width = originalData.width;
    const height = originalData.height;
    const pixels = originalData.data;
    
    // 新しいImageDataを作成
    const normalData = normalCtx.createImageData(width, height);
    const normalPixels = normalData.data;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // 隣接ピクセルの取得（境界チェック付き）
        const left = x > 0 ? this.getPixelBrightness(pixels, width, x - 1, y) : this.getPixelBrightness(pixels, width, x, y);
        const right = x < width - 1 ? this.getPixelBrightness(pixels, width, x + 1, y) : this.getPixelBrightness(pixels, width, x, y);
        const top = y > 0 ? this.getPixelBrightness(pixels, width, x, y - 1) : this.getPixelBrightness(pixels, width, x, y);
        const bottom = y < height - 1 ? this.getPixelBrightness(pixels, width, x, y + 1) : this.getPixelBrightness(pixels, width, x, y);
        
        // X方向とY方向の勾配を計算
        const dx = (right - left) * intensity;
        const dy = (bottom - top) * intensity;
        
        // 法線ベクトルを計算
        const nx = Math.min(Math.max(dx, -1), 1) * 0.5 + 0.5;
        const ny = Math.min(Math.max(dy, -1), 1) * 0.5 + 0.5;
        const nz = Math.sqrt(1 - Math.min(1, nx * nx + ny * ny));
        
        // RGBに変換（法線マップの規約に従う）
        const index = (y * width + x) * 4;
        normalPixels[index] = Math.floor(nx * 255);     // R = X
        normalPixels[index + 1] = Math.floor(ny * 255); // G = Y
        normalPixels[index + 2] = Math.floor(nz * 255); // B = Z
        normalPixels[index + 3] = 255;                  // Alpha
      }
    }
    
    normalCtx.putImageData(normalData, 0, 0);
  },
  
  getPixelBrightness: function(pixels, width, x, y) {
    const index = (y * width + x) * 4;
    // 輝度の計算（グレースケール変換）
    return (pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114) / 255;
  },
  
  dataURLToBlob: function(dataURL) {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
  }
};

// ガイド表示のためのグローバル変数
let ghostGuideTimer = null;

// ゴーストガイド表示関数
function showGhostGuide(params) {
  // 既存のゴーストレイヤーを削除
  app.layers = app.layers.filter(layer => !layer.isGhost);
  
  // ゴーストレイヤーからフェードアウトクラスを削除
  const ghostLayers = document.querySelectorAll('.ghost-guide-fadeout');
  ghostLayers.forEach(layer => {
    layer.classList.remove('ghost-guide-fadeout');
  });
  
  // パラメータに基づいてゴーストレイヤーを作成
  if (params) {
    const ghostLayer = new Layer(-1, params.type, {...params});
    ghostLayer.isGhost = true;
    // 色を常にRGBA形式で指定して透明度制御を可能に
    ghostLayer.params.color = 'rgba(255, 255, 255, 0.5)';
    app.layers.push(ghostLayer);
    renderCanvas();
  }
}

// ゴーストガイド非表示関数（フェードアウト効果付き）
function hideGhostGuide() {
  // 既存のゴーストレイヤーを見つける
  const ghostLayers = app.layers.filter(layer => layer.isGhost);
  
  if (ghostLayers.length > 0) {
    // アニメーションフレーム用変数を初期化
    let fadeOpacity = 0.5;
    const fadeInterval = 0.05;
    const fadeStep = 20; // ミリ秒
    
    // フェードアウトのアニメーション関数
    const fadeAnimation = () => {
      fadeOpacity -= fadeInterval;
      
      if (fadeOpacity <= 0) {
        // アニメーション終了: ゴーストレイヤーを削除
        app.layers = app.layers.filter(layer => !layer.isGhost);
        renderCanvas();
        return;
      }
      
      // ゴーストレイヤーの色のアルファ値を更新
      ghostLayers.forEach(layer => {
        // 既存の色情報から新しいRGBA文字列を生成
        const colorRGB = layer.params.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (colorRGB) {
          // RGBA形式の場合
          layer.params.color = `rgba(${colorRGB[1]}, ${colorRGB[2]}, ${colorRGB[3]}, ${fadeOpacity})`;
        } else {
          // Hex形式やその他の形式の場合は直接RGBA形式に変換
          layer.params.color = `rgba(255, 255, 255, ${fadeOpacity})`;
        }
      });
      
      // レイヤーを再描画
      renderCanvas();
      
      // 次のフレームをスケジュール
      setTimeout(fadeAnimation, fadeStep);
    };
    
    // アニメーションを開始
    fadeAnimation();
  }
}

// スライダーとフィールドを連動させる関数
function syncSliderAndField(sliderId, fieldId, paramType) {
  const slider = document.getElementById(sliderId);
  if(slider == null) return;
  
  // スライダー入力イベント
  /*
  slider.addEventListener('input', () => {
    field.value = slider.value;

    // 既存のタイマーをクリア
    if (ghostGuideTimer) {
      clearTimeout(ghostGuideTimer);
    }
    
    // ガイド表示更新
    const value = parseFloat(slider.value);
    const paramName = paramType || fieldId.replace('-slider', '').replace('-', '_');
    const tabName = fieldId.split('-')[0]; // 例: circle, shape, line
    
    // 現在のパラメータを取得
    const params = getPreviewParams(tabName, paramName, value);
    showGhostGuide(params);
  });
  */
  
  // スライダー変更完了イベント（mouseupなど）
  /*
  slider.addEventListener('change', () => {
    // 既存のタイマーをクリア
    if (ghostGuideTimer) {
      clearTimeout(ghostGuideTimer);
    }
    
    // ガイド表示更新
    const value = parseFloat(slider.value);
    const paramName = paramType || fieldId.replace('-slider', '').replace('-', '_');
    const tabName = fieldId.split('-')[0]; // 例: circle, shape, line
    
    // 現在のパラメータを取得
    const params = getPreviewParams(tabName, paramName, value);
    showGhostGuide(params);

    // タイマーをセットして2秒後に非表示
    ghostGuideTimer = setTimeout(() => {
      hideGhostGuide();
      ghostGuideTimer = null;
    }, 2000);
  });
  */
  
  const field = document.getElementById(fieldId);
  if(field == null){
    console.error( field_id + ' is null.');
    return;
  }

  // 数値入力フィールド入力イベント（リアルタイム反映のため）
  /*
  field.addEventListener('input', () => {
    slider.value = field.value;
    
    // 既存のタイマーをクリア
    if (ghostGuideTimer) {
      clearTimeout(ghostGuideTimer);
    }
    
    // ガイド表示更新
    const value = parseFloat(field.value);
    const paramName = paramType || fieldId.replace('-slider', '').replace('-', '_');
    const tabName = fieldId.split('-')[0];
    
    const params = getPreviewParams(tabName, paramName, value);
    showGhostGuide(params);

    // タイマーをセットして2秒後に非表示
    ghostGuideTimer = setTimeout(() => {
      hideGhostGuide();
      ghostGuideTimer = null;
    }, 2000);
  });
  */

  // 数値入力フィールド入力イベント
  /*
  field.addEventListener('change', () => {
    slider.value = field.value;
    
    // 既存のタイマーをクリア
    if (ghostGuideTimer) {
      clearTimeout(ghostGuideTimer);
    }
    
    // ガイド表示更新
    const value = parseFloat(field.value);
    const paramName = paramType || fieldId.replace('-slider', '').replace('-', '_');
    const tabName = fieldId.split('-')[0];
    
    const params = getPreviewParams(tabName, paramName, value);
    showGhostGuide(params);
    
    // タイマーをセットして2秒後に非表示
    ghostGuideTimer = setTimeout(() => {
      hideGhostGuide();
      ghostGuideTimer = null;
    }, 2000);
  });
  */
}

// スライダードラッグ中にゴーストガイドを表示する関数
function setupGhostGuide(type, paramName, sliderId) {
  const slider = document.getElementById(sliderId);
  const field_id = sliderId.replace('-slider', '');
  const field = document.getElementById(field_id);

  if(slider == null) return;
  slider.addEventListener('input', () => {
    if(field != null) field.value = slider.value;

    // 現在の入力値を取得
    const value = parseFloat(slider.value);
    
    // 現在のパラメータを取得
    const params = getPreviewParams(type, paramName, value);
    
    // ゴーストガイド表示
    showGhostGuide(params);
  });
  
  slider.addEventListener('change', () => {
    // 既存のタイマーをクリア
    if (ghostGuideTimer) {
      clearTimeout(ghostGuideTimer);
    }
    
    // タイマーをセットして2秒後に非表示（即時非表示ではなく）
    ghostGuideTimer = setTimeout(() => {
      hideGhostGuide();
      ghostGuideTimer = null;
    }, 2000);
  });

  if(field == null){
    console.error( field_id + ' is null.');
    return;
  }
  field.addEventListener('input', () => {
    slider.value = field.value;
    
    // 現在の入力値を取得
    const value = parseFloat(slider.value);
    
    // 現在のパラメータを取得
    const params = getPreviewParams(type, paramName, value);
    console.log( params.type + ', ' + paramName + ' is ' + value);

    // ゴーストガイド表示
    showGhostGuide(params);

    // 既存のタイマーをクリア
    if (ghostGuideTimer) {
      clearTimeout(ghostGuideTimer);
    }
    
    // タイマーをセットして2秒後に非表示（即時非表示ではなく）
    ghostGuideTimer = setTimeout(() => {
      hideGhostGuide();
      ghostGuideTimer = null;
    }, 2000);
  });
}

// プレビュー用パラメータ取得関数
function getPreviewParams(type, paramName, value) {
  let params;
  
  switch (type) {
    case 'circle':
      params = {
        type: 'circle',
        radius: paramName === 'radius' ? value : parseFloat(document.getElementById('circle-radius').value),
        thickness: paramName === 'thickness' ? value : parseInt(document.getElementById('circle-thickness').value),
        style: document.getElementById('circle-style').value,
        color: 'rgba(255, 255, 255, 0.5)'
      };
      break;
      
    case 'shapes':
      params = {
        type: 'shapes',
        shapeType: document.getElementById('shape-type').value,
        size: paramName === 'size' ? value : parseFloat(document.getElementById('shape-size').value),
        count: paramName === 'count' ? value : parseInt(document.getElementById('shape-count').value),
        radius: paramName === 'radius' ? value : parseFloat(document.getElementById('shape-radius').value),
        offset: paramName === 'offset' ? value : parseInt(document.getElementById('shape-offset').value),
        rotation: paramName === 'rotation' ? value : parseInt(document.getElementById('shape-rotation').value),
        aspect: paramName === 'aspect' ? value : parseFloat(document.getElementById('shape-aspect').value),
        fill: document.getElementById('shape-fill').value,
        color: 'rgba(255, 255, 255, 0.5)'
      };
      break;
      
    case 'lines':
      params = {
        type: 'lines',
        lineType: document.getElementById('line-type').value,
        count: paramName === 'count' ? value : parseInt(document.getElementById('line-count').value),
        radius: paramName === 'radius' ? value : parseFloat(document.getElementById('line-radius').value),
        thickness: paramName === 'thickness' ? value : parseInt(document.getElementById('line-thickness').value),
        offset: paramName === 'offset' ? value : parseInt(document.getElementById('line-offset').value),
        color: 'rgba(255, 255, 255, 0.5)'
      };
      
      if (params.lineType === 'star') {
        params.starFactor = paramName === 'starFactor' ? value : parseFloat(document.getElementById('star-factor').value);
      }
      break;
  }
  
  return params;
}

// タブ内のイベントハンドラを設定（再利用可能にした）
function setupTabEventListeners(){
  // スライダーと入力フィールドの連動設定
  syncSliderAndField('circle-radius-slider', 'circle-radius');
  syncSliderAndField('circle-thickness-slider', 'circle-thickness');
  //syncSliderAndField('circle-style', 'circle-style');
  //syncSliderAndField('shape-type', 'shape-type');
  syncSliderAndField('shape-size-slider', 'shape-size');
  syncSliderAndField('shape-count-slider', 'shape-count');
  syncSliderAndField('shape-radius-slider', 'shape-radius');
  syncSliderAndField('shape-offset-slider', 'shape-offset');
  syncSliderAndField('shape-rotation-slider', 'shape-rotation');
  syncSliderAndField('shape-aspect-slider', 'shape-aspect');
  syncSliderAndField('line-count-slider', 'line-count');
  syncSliderAndField('line-radius-slider', 'line-radius');
  syncSliderAndField('line-thickness-slider', 'line-thickness');
  syncSliderAndField('line-offset-slider', 'line-offset');
  syncSliderAndField('star-factor-slider', 'star-factor');
  
  // ゴーストガイド設定
  setupGhostGuide('circle', 'radius', 'circle-radius-slider');
  setupGhostGuide('circle', 'thickness', 'circle-thickness-slider');
  setupGhostGuide('circle', 'style', 'circle-style');
  setupGhostGuide('shapes', 'type', 'shape-type');
  setupGhostGuide('shapes', 'size', 'shape-size-slider');
  setupGhostGuide('shapes', 'count', 'shape-count-slider');
  setupGhostGuide('shapes', 'radius', 'shape-radius-slider');
  setupGhostGuide('shapes', 'offset', 'shape-offset-slider');
  setupGhostGuide('shapes', 'rotation', 'shape-rotation-slider');
  setupGhostGuide('shapes', 'aspect', 'shape-aspect-slider');
  setupGhostGuide('shapes', 'fill', 'shape-fill');
  setupGhostGuide('lines', 'type', 'line-type');
  setupGhostGuide('lines', 'count', 'line-count-slider');
  setupGhostGuide('lines', 'radius', 'line-radius-slider');
  setupGhostGuide('lines', 'thickness', 'line-thickness-slider');
  setupGhostGuide('lines', 'offset', 'line-offset-slider');
  setupGhostGuide('lines', 'starFactor', 'star-factor-slider');
}

// DOM要素のイベント設定
function setupEventListeners() {
  setupTabEventListeners();

  // タブ切り替え
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', (e) => {
      // タブボタンの切り替え
      document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
      });
      e.currentTarget.classList.add('active');
      
      // タブコンテンツの切り替え
      const tabId = e.currentTarget.dataset.tab;
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(tabId).classList.add('active');

      // タブイベントを再登録
      setTimeout(() => {
        setupTabEventListeners();
      }, 500);
    });
  });
  
  // 円の追加
  document.getElementById('add-circle').addEventListener('click', () => {
    const radius = parseFloat(document.getElementById('circle-radius').value);
    const thickness = parseInt(document.getElementById('circle-thickness').value);
    const style = document.getElementById('circle-style').value;
    
    LayerManager.addLayer('circle', {
      radius,
      thickness,
      style,
      color: app.settings.foregroundColor
    });
  });
  
  // 図形の追加
  document.getElementById('add-shapes').addEventListener('click', () => {
    const shapeType = document.getElementById('shape-type').value;
    const size = parseFloat(document.getElementById('shape-size').value);
    const count = parseInt(document.getElementById('shape-count').value);
    const radius = parseFloat(document.getElementById('shape-radius').value);
    const offset = parseInt(document.getElementById('shape-offset').value);
    const rotation = parseInt(document.getElementById('shape-rotation').value);
    const aspect = parseFloat(document.getElementById('shape-aspect').value);
    const fill = document.getElementById('shape-fill').value;
    
    LayerManager.addLayer('shapes', {
      shapeType,
      size,
      count,
      radius,
      offset,
      rotation,
      aspect,
      fill,
      color: app.settings.foregroundColor
    });
  });
  
  // 線の追加
  document.getElementById('add-lines').addEventListener('click', () => {
    const lineType = document.getElementById('line-type').value;
    const count = parseInt(document.getElementById('line-count').value);
    const radius = parseFloat(document.getElementById('line-radius').value);
    const thickness = parseInt(document.getElementById('line-thickness').value);
    const offset = parseInt(document.getElementById('line-offset').value);
    
    const params = {
      lineType,
      count,
      radius,
      thickness,
      offset,
      color: app.settings.foregroundColor
    };
    
    // 星形の場合は係数を追加
    if (lineType === 'star') {
      params.starFactor = parseFloat(document.getElementById('star-factor').value);
    }
    
    LayerManager.addLayer('lines', params);
  });
  
  // 基本設定の変更
  document.getElementById('transparent-background').addEventListener('change', (e) => {
    app.settings.transparentBackground = e.target.checked;
    renderCanvas();
  });
  
  document.getElementById('background-color').addEventListener('input', (e) => {
    app.settings.backgroundColor = e.target.value;
    renderCanvas();
  });
  
  document.getElementById('foreground-color').addEventListener('input', (e) => {
    app.settings.foregroundColor = e.target.value;
  });
  
  // エクスポートフォーマット変更時の表示切り替え
  document.getElementById('export-format').addEventListener('change', (e) => {
    const format = e.target.value;
    const normalMapGroup = document.getElementById('normal-map-intensity-group');
    const textureSizeGroup = document.getElementById('texture-size').parentNode;
    
    if (format === 'normalmap') {
      normalMapGroup.style.display = 'block';
      textureSizeGroup.style.display = 'block';
    } else if (format === 'json') {
      normalMapGroup.style.display = 'none';
      textureSizeGroup.style.display = 'none';
    } else {
      normalMapGroup.style.display = 'none';
      textureSizeGroup.style.display = 'block';
    }
  });
  
  // エクスポートボタン
  document.getElementById('export-button').addEventListener('click', () => {
    const format = document.getElementById('export-format').value;
    Exporter.exportImage(format);
  });
  
  // リセットボタン
  document.getElementById('reset-button').addEventListener('click', () => {
    if (confirm('すべてのレイヤーをクリアしますか？')) {
      app.layers = [];
      app.activeLayer = null;
      app.nextLayerId = 0;
      LayerManager.updateLayersList();
      renderCanvas();
    }
  });
  
  // ランダム生成ボタン
  document.getElementById('random-button').addEventListener('click', () => {
    generateRandomMagicCircle();
  });
  
  // 線タイプによる星形係数の表示/非表示
  document.getElementById('line-type').addEventListener('change', (e) => {
    const lineType = e.target.value;
    const starFactorGroup = document.getElementById('star-factor-group');
    
    if (lineType === 'star') {
      starFactorGroup.style.display = 'block';
    } else {
      starFactorGroup.style.display = 'none';
    }
  });
}

// ランダム魔法陣生成関数
function generateRandomMagicCircle() {
  // 既存のレイヤーをクリア
  app.layers = [];
  app.activeLayer = null;
  app.nextLayerId = 0;
  
  // 円を追加（2～5個）
  const baseCircleCount = Math.floor(Math.random() * 4) + 2; // 2～5の範囲
  for (let i = 0; i < baseCircleCount; i++) {
    const radius = 0.2 + Math.random() * 0.75; // 0.2〜0.9の範囲
    const thickness = 1 + Math.floor(Math.random() * 6); // 1〜6の範囲
    const styles = ['solid', 'dashed', 'dotted'];
    const style = styles[Math.floor(Math.random() * styles.length)];
    
    LayerManager.addLayer('circle', {
      radius,
      thickness,
      style,
      color: app.settings.foregroundColor
    });
  }
  
  // 図形を追加（0～5個）
  const shapeCount = Math.floor(Math.random() * 6); // 0～5の範囲
  if (shapeCount > 0) {
    for (let i = 0; i < shapeCount; i++) {
      // 各レイヤーごとに分割数を決める
    const divisionCount = 3 + Math.floor(Math.random() * 22); // 3～12の範囲
      const shapeTypes = ['circle', 'square', 'triangle', 'diamond', 'star'];
      const shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
      const count = divisionCount + Math.floor(Math.random() * 3) - 1; // divisionCountの前後で分割数を調整
      const radius = 0.2 + Math.random() * 0.75; // 0.2～0.9の範囲
      const shapeSize = 0.01 + Math.random() * 0.06 + (0.3 / divisionCount); // 0.02～0.08の範囲
      
      LayerManager.addLayer('shapes', {
        shapeType,
        size: shapeSize,
        count: divisionCount,
        radius: radius,
        offset: 15 * Math.floor(Math.random() * 4), // 0 15 30 45
        rotation: 0, // 0
        aspect: 0.8 + Math.random() * 0.4, // 0.8～1.2の範囲
        fill: ['fill', 'stroke', 'both'][Math.floor(Math.random() * 3)],
        color: app.settings.foregroundColor
      });
    }
  }
  
  // 接続線を追加（0～2個）
  const lineCount = Math.floor(Math.random() * 3); // 0～2の範囲
  if (lineCount > 0) {
    for (let i = 0; i < lineCount; i++) {
      // 各線レイヤーごとに分割数を計算
      const divisionCount = 3 + Math.floor(Math.random() * 8); // 3～10の範囲
      const lineTypes = ['connecting', 'polygon', 'star'];
      const lineType = lineTypes[Math.floor(Math.random() * lineTypes.length)];
      LayerManager.addLayer('lines', {
        lineType: lineType,
        count: divisionCount,
        radius: 0.2 + Math.random() * 0.75, // 0.3～0.95の範囲
        thickness: 1 + Math.floor(Math.random() * 2), // 1～3の範囲
        offset: 0, // 0
        color: app.settings.foregroundColor
      });
    }
  }
  
  // レイヤーリスト更新
  LayerManager.updateLayersList();
  renderCanvas();
}

// レスポンシブ対応用のリサイズ処理
function resizeCanvas() {
  const container = document.querySelector('.canvas-container');
  if (!container || !app.canvas) return;
  
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  
  // 正方形に保つため、小さい方のサイズを使用
  const size = Math.min(containerWidth, containerHeight) - 40; // 余白用に少し小さく
  
  // キャンバスのスタイルを設定
  app.canvas.style.width = `${size}px`;
  app.canvas.style.height = `${size}px`;
  
  // レンダリングも更新
  renderCanvas();
}

var json_string = {
  "settings": {
    "backgroundColor": "#000000",
    "foregroundColor": "#ffffff",
    "transparentBackground": true
  },
  "layers": [
    {
      "type": "circle",
      "params": {
        "radius": 0.5732598012793432,
        "thickness": 3,
        "style": "solid",
        "color": "#ffffff"
      }
    },
    {
      "type": "circle",
      "params": {
        "radius": 0.584480560975069,
        "thickness": 1,
        "style": "solid",
        "color": "#ffffff"
      }
    },
    {
      "type": "circle",
      "params": {
        "radius": 0.8956793552210642,
        "thickness": 3,
        "style": "dashed",
        "color": "#ffffff"
      }
    },
    {
      "type": "circle",
      "params": {
        "radius": 0.4664021968409294,
        "thickness": 3,
        "style": "dashed",
        "color": "#ffffff"
      }
    },
    {
      "type": "circle",
      "params": {
        "radius": 0.8438588750268565,
        "thickness": 2,
        "style": "solid",
        "color": "#ffffff"
      }
    },
    {
      "type": "lines",
      "params": {
        "lineType": "polygon",
        "count": 6,
        "radius": 0.57,
        "thickness": 5,
        "offset": 0,
        "color": "#ffffff"
      }
    },
    {
      "type": "lines",
      "params": {
        "lineType": "polygon",
        "count": 6,
        "radius": 0.57,
        "thickness": 5,
        "offset": 30,
        "color": "#ffffff"
      }
    },
    {
      "type": "circle",
      "params": {
        "radius": 0.29,
        "thickness": 10,
        "style": "solid",
        "color": "#ffffff"
      }
    },
    {
      "type": "circle",
      "params": {
        "radius": 0.25,
        "thickness": 8,
        "style": "dotted",
        "color": "#ffffff"
      }
    },
    {
      "type": "shapes",
      "params": {
        "shapeType": "circle",
        "size": 0.03,
        "count": 36,
        "radius": 0.71,
        "offset": 0,
        "rotation": 0,
        "aspect": 1,
        "fill": "fill",
        "color": "#ffffff"
      }
    },
    {
      "type": "shapes",
      "params": {
        "shapeType": "circle",
        "size": 0.15,
        "count": 6,
        "radius": 0.71,
        "offset": 30,
        "rotation": 0,
        "aspect": 1,
        "fill": "fill",
        "color": "#ffffff"
      }
    },
    {
      "type": "shapes",
      "params": {
        "shapeType": "diamond",
        "size": 0.07,
        "count": 16,
        "radius": 0.12,
        "offset": 30,
        "rotation": 0,
        "aspect": 4.1,
        "fill": "fill",
        "color": "#ffffff"
      }
    },
    {
      "type": "lines",
      "params": {
        "lineType": "polygon",
        "count": 6,
        "radius": 0.89,
        "thickness": 3,
        "offset": 0,
        "color": "#ffffff"
      }
    },
    {
      "type": "lines",
      "params": {
        "lineType": "polygon",
        "count": 6,
        "radius": 0.89,
        "thickness": 3,
        "offset": 30,
        "color": "#ffffff"
      }
    },
    {
      "type": "lines",
      "params": {
        "lineType": "polygon",
        "count": 3,
        "radius": 0.57,
        "thickness": 3,
        "offset": 30,
        "color": "#ffffff"
      }
    },
    {
      "type": "lines",
      "params": {
        "lineType": "polygon",
        "count": 3,
        "radius": 0.57,
        "thickness": 3,
        "offset": 90,
        "color": "#ffffff"
      }
    },
    {
      "type": "circle",
      "params": {
        "radius": 0.17,
        "thickness": 2,
        "style": "dotted",
        "color": "#ffffff"
      }
    },
    {
      "type": "circle",
      "params": {
        "radius": 0.61,
        "thickness": 2,
        "style": "dotted",
        "color": "#ffffff"
      }
    },
    {
      "type": "circle",
      "params": {
        "radius": 0.93,
        "thickness": 6,
        "style": "solid",
        "color": "#ffffff"
      }
    }
  ]
};
var preset_json = JSON.stringify(json_string);

// 初期化
function init() {
  // キャンバスの設定
  app.canvas = document.getElementById('magic-circle-canvas');
  app.ctx = app.canvas.getContext('2d');
  
  // イベントリスナーのセットアップ
  setupEventListeners();
  
  // インポートファイルのセットアップ
  document.getElementById('import-button').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  
  document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
      const success = importLayersFromJSON(event.target.result);
      if (success) {
        //alert('レイヤーデータのインポートが完了しました。');
      } else {
        alert('レイヤーデータのインポート中にエラーが発生しました。');
      }
      // ファイル入力をリセット
      e.target.value = '';
    };
    reader.readAsText(file);
  });
  
  // ウィンドウのリサイズイベントを監視
  window.addEventListener('resize', resizeCanvas);
  
  // 初期魔法陣の生成
  //generateRandomMagicCircle();
  importLayersFromJSON(preset_json);
  
  // 初期レンダリングとサイズ調整
  resizeCanvas();
}

// ページロード時に初期化
window.addEventListener('load', init);