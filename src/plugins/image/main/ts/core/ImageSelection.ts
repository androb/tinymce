/**
 * ImageSelection.ts
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2018 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

import { Editor } from 'tinymce/core/api/Editor';
import { defaultData, read, ImageData, create, isFigure, write } from 'tinymce/plugins/image/core/ImageData';
import Utils from 'tinymce/plugins/image/core/Utils';

const normalizeCss = (editor: Editor, cssText: string): string => {
  const css = editor.dom.styles.parse(cssText);
  const mergedCss = Utils.mergeMargins(css);
  const compressed = editor.dom.styles.parse(editor.dom.styles.serialize(mergedCss));
  return editor.dom.styles.serialize(compressed);
};

const getSelectedImage = (editor: Editor): HTMLElement => {
  const imgElm = editor.selection.getNode() as HTMLElement;
  const figureElm = editor.dom.getParent(imgElm, 'figure.image') as HTMLElement;

  if (figureElm) {
    return editor.dom.select('img', figureElm)[0];
  }

  if (imgElm &&
    (imgElm.nodeName !== 'IMG' ||
      imgElm.getAttribute('data-mce-object') ||
      imgElm.getAttribute('data-mce-placeholder'))) {
    return null;
  }

  return imgElm;
};

const splitTextBlock = (editor: Editor, figure: HTMLElement) => {
  const dom = editor.dom;

  const textBlock = dom.getParent(figure.parentNode, function (node) {
    return editor.schema.getTextBlockElements()[node.nodeName];
  });

  if (textBlock) {
    dom.split(textBlock, figure);
  }
};

const readImageDataFromSelection = (editor: Editor): ImageData => {
  const image = getSelectedImage(editor);
  return image ? read((css) => normalizeCss(editor, css), image) : defaultData();
};

const insertImageAtCaret = (editor: Editor, data: ImageData) => {
  const elm = create((css) => normalizeCss(editor, css), data);

  editor.dom.setAttrib(elm, 'data-mce-id', '__mcenew');
  editor.selection.setContent(elm.outerHTML);

  const insertedElm = editor.dom.select('*[data-mce-id="__mcenew"]')[0];
  editor.dom.setAttrib(insertedElm, 'data-mce-id', null);

  if (isFigure(elm)) {
    splitTextBlock(editor, elm);
  }

  editor.selection.select(insertedElm);
};

const syncSrcAttr = (editor: Editor, image: HTMLElement) => {
  editor.dom.setAttrib(image, 'src', image.getAttribute('src'));
};

const deleteImage = (editor: Editor, image: HTMLElement) => {
  if (image) {
    const elm = editor.dom.is(image.parentNode, 'figure.image') ? image.parentNode : image;

    editor.dom.remove(elm);
    editor.focus();
    editor.nodeChanged();

    if (editor.dom.isEmpty(editor.getBody())) {
      editor.setContent('');
      editor.selection.setCursorLocation();
    }
  }
};

const writeImageDataToSelection = (editor: Editor, data: ImageData) => {
  const image = getSelectedImage(editor);

  write((css) => normalizeCss(editor, css), data, image);
  syncSrcAttr(editor, image);

  if (isFigure(image.parentNode)) {
    splitTextBlock(editor, image.parentNode as HTMLElement);
    editor.selection.select(image.parentNode);
  } else {
    editor.selection.select(image);
    Utils.waitLoadImage(editor, data, image);
  }
};

const insertOrUpdateImage = (editor: Editor, data: ImageData) => {
  const image = getSelectedImage(editor);

  if (image) {
    if (data.src) {
      writeImageDataToSelection(editor, data);
    } else {
      deleteImage(editor, image);
    }
  } else if (data.src) {
    insertImageAtCaret(editor, data);
  }
};

export {
  normalizeCss,
  readImageDataFromSelection,
  insertOrUpdateImage
};