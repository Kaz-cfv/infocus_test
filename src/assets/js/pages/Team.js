/**
 * Team - Team一覧・詳細ページの管理クラス
 */

import { TeamManager, TeamAPI, TeamList, TeamDetail } from '../modules/TeamManager';

export class Team {
  constructor() {
    this.teamManager = new TeamManager();
    this.init();
  }

  async init() {
    const currentPath = window.location.pathname;

    if (currentPath.includes('/team/') && currentPath !== '/team/') {
      // 詳細ページ
      const teamId = this.extractTeamId(currentPath);
      if (teamId) {
        await this.teamManager.initDetail(teamId);
      }
    } else if (currentPath === '/team/' || currentPath.includes('/team')) {
      // 一覧ページ
      await this.teamManager.initList();
    }
  }

  extractTeamId(path) {
    const matches = path.match(/\/team\/(\d+)/);
    return matches ? matches[1] : null;
  }
}
