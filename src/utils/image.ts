import ImageKit from "imagekit";
import { environment } from "../environment/environment";
import { ReadStream } from "fs";
import { UploadResponse } from "imagekit/dist/libs/interfaces/UploadResponse";
import { Observable, of } from "rxjs";
import { switchMap } from "rxjs/operators";

const imageKit = new ImageKit({
    publicKey: environment.imagekit.publicKey,
    privateKey: environment.imagekit.privateKey,
    urlEndpoint: environment.imagekit.endpoint
});

export function uploadImage(
    file: string | Buffer | ReadStream,
    fileName: string,
    folder = ""
): Observable<UploadResponse> {
    return new Observable((observer) => {
        imageKit
            .upload({
                file,
                fileName,
                folder
            })
            .then((response) => {
                observer.next(response);
            })
            .catch((error) => {
                observer.error(error);
            })
            .finally(() => {
                observer.complete();
            });
    });
}

export function deleteImage(fileId?: string): Observable<boolean> {
    if (!fileId) {
        return of(false);
    }

    return new Observable((observer) => {
        imageKit
            .deleteFile(fileId)
            .then(() => {
                observer.next(true);
            })
            .catch((error: { message: string; help: string }) => {
                if (error.message === "The requested file does not exist.") {
                    observer.next();
                    return;
                }
                observer.error(error);
            })
            .finally(() => {
                observer.complete();
            });
    });
}

export function replaceImage(
    replaceId: string = "",
    file: string | Buffer | ReadStream,
    fileName: string,
    folder = ""
): Observable<UploadResponse> {
    return deleteImage(replaceId).pipe(
        switchMap(() => {
            return uploadImage(file, fileName, folder);
        })
    );
}
