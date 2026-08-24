// bot/src/telegram.js — a thin Bot API client over native fetch. No dependencies.
import { config } from './config.js';

const API = `https://api.telegram.org/bot${config.botToken}`;
const FILE_API = `https://api.telegram.org/file/bot${config.botToken}`;

async function call(method, params = {}) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!json.ok) {
    throw new Error(`Telegram ${method} failed: ${json.description || res.status}`);
  }
  return json.result;
}

export const telegram = {
  call,

  /** Long-poll. Returns [] on a timeout rather than throwing, so the loop is simple. */
  async getUpdates(offset) {
    try {
      return await call('getUpdates', {
        offset,
        timeout: 30,
        allowed_updates: ['message', 'callback_query'],
      });
    } catch (err) {
      // A dropped long-poll is routine; anything else is worth surfacing.
      if (!/aborted|timeout|fetch failed|ETIMEDOUT|ECONNRESET/i.test(err.message)) {
        console.error('getUpdates:', err.message);
      }
      await new Promise((r) => setTimeout(r, 2000));
      return [];
    }
  },

  send(chatId, text, extra = {}) {
    return call('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
      ...extra,
    });
  },

  /** Inline keyboard helper: rows of [label, callbackData] pairs. */
  buttons(rows) {
    return {
      reply_markup: {
        inline_keyboard: rows.map((row) =>
          row.map(([text, data]) => ({ text, callback_data: data }))
        ),
      },
    };
  },

  answerCallback(id, text) {
    return call('answerCallbackQuery', { callback_query_id: id, text });
  },

  editText(chatId, messageId, text) {
    return call('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
    });
  },

  /**
   * Download a file by file_id. The cloud Bot API caps this at ~20MB, which is
   * comfortably above a compressed Telegram photo but can be hit by an
   * uncompressed original from a recent phone.
   */
  async download(fileId) {
    const file = await call('getFile', { file_id: fileId });
    const res = await fetch(`${FILE_API}/${file.file_path}`);
    if (!res.ok) throw new Error(`Photo download failed: HTTP ${res.status}`);
    return {
      bytes: Buffer.from(await res.arrayBuffer()),
      ext: (file.file_path.match(/\.([a-z0-9]+)$/i)?.[1] || 'jpg').toLowerCase(),
    };
  },
};
