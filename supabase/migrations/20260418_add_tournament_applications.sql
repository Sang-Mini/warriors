-- tournament_applications 테이블 생성
CREATE TABLE IF NOT EXISTS tournament_applications (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tournament_id  uuid        NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  applied_at     timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tournament_id)
);

-- RLS 활성화
ALTER TABLE tournament_applications ENABLE ROW LEVEL SECURITY;

-- 본인 신청 내역만 조회 가능
CREATE POLICY "users_read_own_applications"
  ON tournament_applications FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 신청 내역만 추가 가능
CREATE POLICY "users_insert_own_applications"
  ON tournament_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 신청 내역만 삭제 가능
CREATE POLICY "users_delete_own_applications"
  ON tournament_applications FOR DELETE
  USING (auth.uid() = user_id);
