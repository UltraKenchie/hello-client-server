import { Request, Response } from "express";
import { UploadResponse } from "imagekit/dist/libs/interfaces";
import { isEmpty, template } from "lodash";
import { forkJoin, from, Observable, of } from "rxjs";
import { switchMap, tap } from "rxjs/operators";
import { ResponseClass } from "../classes/response";
import { pagination } from "../functions/pagination";
import { Image } from "../interfaces/image";
import { PaginateResult } from "../interfaces/mongoose";
import { RequestClient } from "../interfaces/requests/request-client";
import { RequestPage } from "../interfaces/requests/request-page";
import { client, ClientDocument, ClientPopulatedDocument } from "../models/client";
import { UserInterface } from "../models/user";
import { uploadImage, replaceImage, deleteImage } from "../utils/image";

const clientImagePath = "client";

export const createClient = (
    req: Request<unknown, unknown, RequestClient>,
    res: Response
): void => {
    const response = new ResponseClass<ClientDocument | null>();

    let tempClient: ClientDocument;

    from(
        client.create({
            organizationName: req.body.organizationName,
            organizationImage: null,
            contactName: req.body.contactName,
            contactImage: null,
            contactPhoneNumber: req.body.contactPhoneNumber,
            contactEmail: req.body.contactEmail,
            website: req.body.website,
            status: req.body.status,
            assigned: req.body.assigned
        })
    )
        .pipe(
            switchMap((newClient) => {
                tempClient = newClient;

                let orgUpload = of<UploadResponse | null>(null);
                let contactUpload = of<UploadResponse | null>(null);

                if (req.body.organizationImage) {
                    orgUpload = uploadImage(
                        req.body.organizationImage,
                        `${newClient.id}_${newClient.organizationName}`,
                        clientImagePath
                    );
                }

                if (req.body.contactImage) {
                    contactUpload = uploadImage(
                        req.body.contactImage,
                        `${newClient.id}_${newClient.contactName}`,
                        clientImagePath
                    );
                }

                return forkJoin([orgUpload, contactUpload]);
            }),
            switchMap(([orgImage, contactImage]) => {
                if (orgImage !== null) {
                    tempClient.organizationImage = {
                        id: orgImage.fileId,
                        path: orgImage.filePath
                    };
                }

                if (contactImage !== null) {
                    tempClient.contactImage = {
                        id: contactImage.fileId,
                        path: contactImage.filePath
                    };
                }

                return from(tempClient.save());
            }),
            switchMap((response) =>
                client.findById(response.id).populate("assigned", "_id id name email avatar")
            )
        )
        .subscribe(
            (result) => {
                response.body = result;
            },
            (error) => {
                response.toServerError(error);
                res.status(response.status).json(response);
            },
            () => {
                res.status(response.status).json(response);
            }
        );
};

export const updateClient = (
    req: Request<{ id: string }, unknown, RequestClient>,
    res: Response
): void => {
    const response = new ResponseClass<ClientDocument | null>();

    let tempClient: ClientDocument | null = null;

    from(
        client.findByIdAndUpdate(req.params.id, {
            organizationName: req.body.organizationName,
            contactName: req.body.contactName,
            contactPhoneNumber: req.body.contactPhoneNumber,
            contactEmail: req.body.contactEmail,
            website: req.body.website,
            status: req.body.status,
            assigned: req.body.assigned === "null" ? null : req.body.assigned
        })
    )
        .pipe(
            switchMap((oldClient) => {
                tempClient = oldClient;

                let orgUpload = of<UploadResponse | boolean | null>(null);
                let contactUpload = of<UploadResponse | boolean | null>(null);

                if (!oldClient) {
                    return forkJoin([orgUpload, orgUpload]);
                }

                if (!!req.body.organizationImage) {
                    orgUpload =
                        isEmpty(oldClient) || !!oldClient.organizationImage
                            ? replaceImage(
                                  oldClient.organizationImage?.id,
                                  req.body.organizationImage,
                                  `${oldClient.id}_${oldClient.organizationName}`,
                                  clientImagePath
                              )
                            : uploadImage(
                                  req.body.organizationImage,
                                  `${oldClient.id}_${oldClient.organizationName}`,
                                  clientImagePath
                              );
                } else if (req.body.organizationImage === "") {
                    orgUpload = deleteImage(oldClient.organizationImage?.id);
                }

                if (!!req.body.contactImage) {
                    contactUpload =
                        isEmpty(oldClient) || oldClient.contactImage !== null
                            ? replaceImage(
                                  oldClient.contactImage?.id,
                                  req.body.contactImage,
                                  `${oldClient.id}_${oldClient.contactName}`,
                                  clientImagePath
                              )
                            : uploadImage(
                                  req.body.contactImage,
                                  `${oldClient.id}_${oldClient.contactName}`,
                                  clientImagePath
                              );
                } else if (req.body.contactImage === "") {
                    contactUpload = deleteImage(oldClient.contactImage?.id);
                }

                return forkJoin([orgUpload, contactUpload]);
            }),
            switchMap(([orgImage, contactImage]) => {
                if (tempClient === null) {
                    return of(null);
                }

                if (orgImage === true) {
                    tempClient.organizationImage = null;
                } else if (typeof orgImage !== "boolean" && orgImage !== null) {
                    tempClient.organizationImage = {
                        id: orgImage.fileId,
                        path: orgImage.filePath
                    };
                }

                if (contactImage === true) {
                    tempClient.contactImage = null;
                } else if (typeof contactImage !== "boolean" && contactImage !== null) {
                    tempClient.contactImage = {
                        id: contactImage.fileId,
                        path: contactImage.filePath
                    };
                }

                return from(tempClient.save());
            }),
            switchMap((oldClient) =>
                oldClient
                    ? client.findById(oldClient.id).populate("assigned", "_id id name email avatar")
                    : of(null)
            )
        )
        .subscribe(
            (updatedClient) => {
                if (updatedClient === null) {
                    response.toNotFound();
                    return;
                }

                response.body = updatedClient;
            },
            (error) => {
                response.toServerError(error);
                res.status(response.status).json(response);
            },
            () => {
                res.status(response.status).json(response);
            }
        );
};

export const findClients = (
    req: Request<unknown, unknown, unknown, RequestPage>,
    res: Response
): void => {
    const response = new ResponseClass<ClientPopulatedDocument[]>();
    const pageOption = pagination(req.query.page, req.query.size);
    const sort: { [key: string]: number } = {};
    if (req.query.sort) {
        const sorts = req.query.sort.split(":");
        sort[sorts[0]] = sorts[1] === "asc" ? 1 : -1;
    }
    from(
        client.paginate(
            {},
            {
                page: pageOption.page,
                limit: pageOption.size,
                sort: sort,
                select: "-__v",
                populate: {
                    path: "assigned",
                    select: "_id id name email avatar"
                }
            }
        )
    ).subscribe(
        (result: PaginateResult<ClientPopulatedDocument>) => {
            if (isEmpty(result.docs)) {
                response.body = [];
                return;
            }

            response.body = result.docs;
            response.meta = {
                perPage: result.limit,
                currentPage: result.page,
                totalPages: result.totalPages,
                totalItems: result.totalDocs
            };
        },
        () => {
            response.toServerError();
            res.status(response.status).json(response);
        },
        () => {
            res.status(response.status).json(response);
        }
    );
};

export const findClientById = (req: Request, res: Response): void => {
    const response = new ResponseClass<ClientDocument | null>();
    from(client.findById(req.params.id).populate("assigned", "_id id name email avatar")).subscribe(
        (result) => {
            response.body = result;
        },
        () => {
            response.toNotFound();
            res.status(response.status).json(response);
        },
        () => {
            res.status(response.status).json(response);
        }
    );
};

export const deleteClient = (req: Request, res: Response): void => {
    const response = new ResponseClass<ClientDocument | null>();

    let tempClient: ClientDocument | null = null;

    from(client.findById(req.params.id))
        .pipe(
            switchMap((oldClient) => {
                tempClient = oldClient;
                if (tempClient === null) {
                    return of(null);
                }

                return forkJoin([
                    deleteImage(oldClient?.organizationImage?.id),
                    deleteImage(oldClient?.contactImage?.id)
                ]);
            }),
            switchMap(() => {
                if (tempClient === null) {
                    return of(null);
                }

                return client.findByIdAndDelete(req.params.id);
            })
        )
        .subscribe(
            (result) => {
                response.body = result;
            },
            () => {
                response.toServerError();
                res.status(response.status).json(response);
            },
            () => {
                res.status(response.status).json(response);
            }
        );
};
