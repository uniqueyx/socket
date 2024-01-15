import Singleton from "./Singleton";

interface IItem {
  cb: Function;
  ctx: unknown;
}

export default class GameEvent extends Singleton {
  static get Instance() {
    return super.GetInstance<GameEvent>();
  }

  private map: Map<String, Array<IItem>> = new Map();

  on(event: String, cb: Function, ctx: unknown) {
    console.log("添加事件",event)
    if (this.map.has(event)) {
      this.map.get(event).push({ cb, ctx });
    } else {
      this.map.set(event, [{ cb, ctx }]);
    }
    console.log("添加事件 map",this.map.size)
  }

  off(event: String, cb: Function, ctx: unknown) {
    if (this.map.has(event)) {
      const index = this.map.get(event).findIndex((i) => cb === i.cb && i.ctx === ctx);
      index > -1 && this.map.get(event).splice(index, 1);
    }
  }

  emit(event: String, ...params: unknown[]) {
    // console.log(this.map.size,"map")
    if (this.map.has(event)) {
      this.map.get(event).forEach(({ cb, ctx }) => {
        // console.log("find   map>>>>")
        cb.apply(ctx, params);
      });
    }
  }

  clear() {
    this.map.clear();
  }
}
