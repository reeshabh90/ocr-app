import { Component } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { WebcamImage } from 'ngx-webcam';
import * as Tesseract from 'tesseract.js';
import * as d3 from 'd3';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'OCR APP';
  croppedImage: any = '';
  cropperReady = false;
  // toggle webcam on/off
  public showWebcam = true;

  // latest snapshot
  public webcamImage: WebcamImage = null;

  // webcam snapshot trigger
  private trigger: Subject<void> = new Subject<void>();

  public triggerSnapshot(): void {
    this.trigger.next();
  }

  public handleImage(webcamImage: WebcamImage): void {
    console.log('received webcam image', webcamImage);
    this.webcamImage = webcamImage;
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  imageCropped(img: string) {
    const self = this;
    const image = new Image();
    image.onload = function () {
      const canvas: any = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const imgEl: any = document.getElementById('img');
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      const imgD = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const rasterData = [];
      for (let j = 0; j < (imgD.data.length / 4); j++) {
        const brightness = d3.lab(d3.rgb(imgD.data[j * 4],
          imgD.data[j * 4 + 1],
          imgD.data[j * 4 + 2])).l;
        rasterData.push(imgD.data[j * 4] === 0 ? null : brightness);
      }

      const scale = self.histogramEqualize(rasterData);

      for (let j = 0; j < rasterData.length; j++) {
        const scaledColor = scale(rasterData[j]);
        const color = d3.rgb(scaledColor);
        imgD.data[j * 4] = color.r;
        imgD.data[j * 4 + 1] = color.g;
        imgD.data[j * 4 + 2] = color.b;
        imgD.data[j * 4 + 3] = 255;
      }

      ctx.putImageData(imgD, 0, 0);
      self.convertToBW(image, canvas);
      self.croppedImage = canvas.toDataURL();
    };
    image.id = 'tempImg';
    image.src = img;
  }

  imageLoaded() {
    this.cropperReady = true;
  }
  loadImageFailed() {
    console.log('Load failed');
  }

  // Function to perform OCR
  performOCR() {
    const img: any = document.getElementById('img');
    Tesseract.recognize(img)
      .then(function (result) {
        console.log('ocr result', result);
        document.getElementById('ocr_results')
          .innerText = result.text;
      });
  }

  // Function to convert Image to Binary B&W
  convertToBW(img, canvas) {
    // console.log('Image for processing', img);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imgD = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgD.data;

    // Convert the image to Greyscale and use a threshold on pixels to convert into binary, threshold value used here : 128
    for (let i = 0, n = pixels.length; i < n; i += 4) {
      const value = (0.2989 * pixels[i] + 0.5870 * pixels[i + 1] + 0.1140 * pixels[i + 2] >= 128) ? 255 : 0;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
    }
    ctx.putImageData(imgD, 0, 0);
    console.log('Canvas base 64', canvas.toDataURL());
  }

  // Function to perform Histogram equilization
  histogramEqualize(values) {
    const buckets = 100;
    const quantiles = d3.scaleQuantile()
      .domain(values)
      .range(d3.range(buckets))
      .quantiles();

    const stopCount = quantiles.length;
    const linearScale = d3.scaleLinear()
      .domain([0, stopCount - 1])
      .range([d3.rgb('rgb(0, 0, 0)'), d3.rgb('rgb(255, 255, 255)')]);

    const grayScale = d3.range(stopCount).map(function (d) {
      return linearScale(d);
    });

    return d3.scaleLinear().domain(quantiles).range(grayScale);
  }


}
