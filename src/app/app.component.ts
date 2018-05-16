import { Component } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { WebcamImage } from 'ngx-webcam';
import * as Tesseract from 'tesseract.js';

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
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      const imgD = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imgD.data;
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

    // 1st Step, convert to GreyScale
    for (let i = 0; i < pixels.length; i += 4) {
      const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      pixels[i] = avg; // red
      pixels[i + 1] = avg; // green
      pixels[i + 2] = avg; // blue
    }

    // 2nd Step, convert to Binary Black & White
    for (let i = 0, n = pixels.length; i < n; i += 4) {
      const gray = 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
      if (gray > 128) {
        pixels[i] = 255;        // red
        pixels[i + 1] = 255;        // green
        pixels[i + 2] = 255;        // blue
      } else {
        pixels[i] = 0;        // red
        pixels[i + 1] = 0;        // green
        pixels[i + 2] = 0;        // blue
      }
    }
    ctx.putImageData(imgD, 0, 0);
    console.log('Canvas base 64', canvas.toDataURL());
  }

  normalize(pixels) {
    const sum = pixels.reduce((a, b) => a + b);
    for (let i = 0; i < pixels.length; ++i) {
      pixels[i] /= sum;
    }

  }

  equalizeHistogram(pixels) {
    const srcLength = pixels.length;

    // Compute histogram and histogram sum:
    const hist = new Float32Array(256);
    let sum = 0;
    for (let i = 0; i < srcLength; ++i) {
      ++hist[~~pixels[i]];
      ++sum;
    }

    // Compute integral histogram:
    let prev = hist[0];
    for (let i = 1; i < 256; ++i) {
      prev = hist[i] += prev;
    }

    // Equalize image:
    const norm = 255 / sum;
    for (let i = 0; i < srcLength; ++i) {
      pixels[i] = hist[~~pixels[i]] * norm;
    }
  }
}
