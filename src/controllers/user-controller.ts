import { Request, Response } from "express";
import { ResponseClass } from "../classes/response";
import { createToken } from "../utils/jwt-token";
import { user, UserDocument, UserInterface, UserPopulatedDocument } from "../models/user";
import { isEmpty } from "lodash";
import { forkJoin, from, of } from "rxjs";
import { RequestLogin } from "../interfaces/requests/request-login";
import { ResponseToken } from "../interfaces/responses/response-token";
import { switchMap } from "rxjs/operators";
import { Image } from "../interfaces/image";
import { uploadImage, replaceImage, deleteImage } from "../utils/image";
import { RequestUser } from "../interfaces/requests/request-user";
import { RequestPage } from "../interfaces/requests/request-page";
import { pagination } from "../functions/pagination";
import { PaginateResult } from "../interfaces/mongoose";
import { UploadResponse } from "imagekit/dist/libs/interfaces";
import { ObjectId } from "mongodb";
import { client } from "../models/client";

const usersImagePath = "users";

export const login = (req: Request<unknown, unknown, RequestLogin>, res: Response): void => {
    const response = new ResponseClass<ResponseToken>();
    user.login(req.body).subscribe(
        (userPopulated) => {
            if (userPopulated === null) {
                response.toUnauthorized("Invalid Login. Please try again.");
                return;
            }

            const newToken = createToken({
                id: userPopulated.id,
                email: userPopulated.email,
                name: userPopulated.name,
                role: userPopulated.role
            });

            response.body = { token: newToken };
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

export const createUser = (req: Request<unknown, unknown, RequestUser>, res: Response): void => {
    const response = new ResponseClass<UserDocument>();
    let tempUser: UserDocument;
    from(
        user.create({
            email: req.body.email,
            name: req.body.name,
            avatar: null,
            password: req.body.password
        })
    )
        .pipe(
            switchMap((newUser) => {
                tempUser = newUser;
                if (!req.body.avatar) {
                    return of(newUser);
                }
                return uploadImage(req.body.avatar, req.body.name, usersImagePath);
            }),
            switchMap((response) => {
                if (!req.body.avatar) {
                    return of(response as UserDocument);
                }

                const avatar = response as UploadResponse;
                tempUser.avatar = {
                    id: avatar.fileId,
                    path: avatar.filePath
                };

                return from(tempUser.save());
            }),
            switchMap((response) => user.findByEmail(response.email))
        )
        .subscribe(
            (user) => {
                response.body = user;
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

export const updateProfile = (
    req: Request<{ id: string }, unknown, RequestUser>,
    res: Response
): void => {
    const response = new ResponseClass<UserDocument | null>();

    let tempUser: UserDocument | null = null;

    from(
        user.findByIdAndUpdate(req.params.id, {
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        })
    )
        .pipe(
            switchMap((oldUser) => {
                tempUser = oldUser;

                if (!oldUser) {
                    return of(null);
                }

                let avatarUpload = of<UploadResponse | boolean | null>(null);

                if (!!req.body.avatar) {
                    avatarUpload =
                        isEmpty(oldUser) || !!oldUser.avatar
                            ? replaceImage(
                                  oldUser.avatar?.id,
                                  req.body.avatar,
                                  `${oldUser.id}_${oldUser.name}`,
                                  usersImagePath
                              )
                            : uploadImage(
                                  req.body.avatar,
                                  `${oldUser.id}_${oldUser.name}`,
                                  usersImagePath
                              );
                } else if (req.body.avatar === "") {
                    avatarUpload = deleteImage(oldUser.avatar?.id);
                }

                return avatarUpload;
            }),
            switchMap((image) => {
                if (tempUser === null) {
                    return of(null);
                }

                if (image === true) {
                    tempUser.avatar = null;
                } else if (typeof image !== "boolean" && image !== null) {
                    tempUser.avatar = {
                        id: image.fileId,
                        path: image.filePath
                    };
                }

                return from(tempUser.save());
            }),
            switchMap(() => (tempUser ? user.findById(tempUser.id, "-__v -password") : of(null)))
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

export const findUsers = (
    req: Request<unknown, unknown, unknown, RequestPage>,
    res: Response
): void => {
    const response = new ResponseClass<UserPopulatedDocument[]>();
    const pageOption = pagination(req.query.page, req.query.size);
    const sort: { [key: string]: number } = {};
    if (req.query.sort) {
        const sorts = req.query.sort.split(":");
        sort[sorts[0]] = sorts[1] === "asc" ? 1 : -1;
    }
    from(
        user.paginate(
            {
                role: "user"
            },
            {
                page: pageOption.page,
                limit: pageOption.size,
                sort: sort,
                select: "-__v -password"
            }
        )
    ).subscribe(
        (result: PaginateResult<UserPopulatedDocument>) => {
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

export const findUserById = (req: Request, res: Response): void => {
    const response = new ResponseClass<UserDocument | null>();
    from(user.findById(req.params.id, "-__v -password")).subscribe(
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

export const deleteUser = (req: Request, res: Response): void => {
    const response = new ResponseClass<UserDocument | null>();

    let tempUser: UserDocument | null = null;

    from(user.findById(req.params.id))
        .pipe(
            switchMap((oldUser) => {
                tempUser = oldUser;
                if (tempUser === null) {
                    return of(null);
                }

                return from(deleteImage(oldUser?.avatar?.id));
            }),
            switchMap(() => {
                if (tempUser === null) {
                    return of(null);
                }

                return forkJoin([
                    from(
                        user.findByIdAndDelete(req.params.id, {
                            projection: { password: 0, __v: 0 }
                        })
                    ),
                    from(
                        client.findOneAndUpdate(
                            {
                                assigned: new ObjectId(req.params.id)
                            },
                            {
                                assigned: null
                            }
                        )
                    )
                ]);
            })
        )
        .subscribe(
            (res) => {
                response.body = res?.[0] ?? null;
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
