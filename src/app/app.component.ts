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

  imageCropped(image: string) {
    this.croppedImage = image;
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
    const canvas: any = document.createElement('canvas');

    this.convertToBW(img, canvas);
    Tesseract.recognize(img.src)
      .then(function (result) {
        // console.log('ocr result', result);
        document.getElementById('ocr_results')
          .innerText = result.text;
        img.src = canvas.toDataURL();
      });
  }

  // Function to convert Image to Binary or B&W
  convertToBW(img, canvas) {

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imgD = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgD.data;
    const pixels = imgD.data;
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


}
